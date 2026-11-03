import { useState, useCallback, useEffect } from 'react'
import { readGoal, createGoal, recordContribution, txLink, friendlyError, formatNgn } from '../lib/savingsContract'
import { formatDate } from '../lib/format'
import { useDashboardData } from '../hooks/useDashboardData'

const oneYearFromToday = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 12)
  return d.toISOString().slice(0, 10)
}

export default function OnchainPanel({ wallet }) {
  const { signer, status, wrongNetwork, switchNetwork } = wallet
  const { data: dashboard } = useDashboardData()
  const offchainBalance = dashboard?.savings?.currentBalance
  const monthlyTarget = dashboard?.savings?.plannedMonthly

  const [goal, setGoal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { kind: 'ok' | 'err' | 'pending', text, hash? }
  const [target, setTarget] = useState(2000000)
  const [date, setDate] = useState(oneYearFromToday)
  const [amount, setAmount] = useState('')
  const ready = status === 'connected' && !wrongNetwork

  useEffect(() => {
    if (amount === '' && monthlyTarget != null) setAmount(String(monthlyTarget))
  }, [amount, monthlyTarget])

  useEffect(() => {
    const prefills = (e) => {
      const value = Number(e.detail?.amount)
      if (value > 0) setAmount(String(Math.round(value)))
    }
    window.addEventListener('record-contribution', prefills)
    return () => window.removeEventListener('record-contribution', prefills)
  }, [])

  const refresh = useCallback(async () => {
    try { setGoal(await readGoal(signer)) } catch (e) { setMsg({ kind: 'err', text: friendlyError(e) }) }
  }, [signer])
  useEffect(() => { if (ready) refresh(); else setGoal(null) }, [ready, refresh])

  const run = async (label, fn) => {
    setBusy(true); setMsg({ kind: 'pending', text: `${label}: Confirm in wallet` })
    try {
      const hash = await fn((h) => setMsg({ kind: 'pending', text: `${label}: waiting for confirmation…`, hash: h }))
      await refresh()
      setMsg({ kind: 'ok', text: `${label}: confirmed.`, hash })
    } catch (e) { setMsg({ kind: 'err', text: friendlyError(e) }) } finally { setBusy(false) }
  }

  const onchainTotal = goal?.totalContributed ?? 0
  const difference = Number(offchainBalance ?? 0) - Number(onchainTotal)

  return (
    <section id="onchain-panel" className="panel chain">
      <h2>On-chain demo record</h2>
      <p className="muted">Celo Sepolia test network. The contract records numbers only; no real money moves and nothing here is checked against a real payment.</p>
      {!ready ? (
        <p>
          {status === 'connected'
            ? <>Switch to Celo Sepolia to continue. <button onClick={switchNetwork}>Switch to Celo Sepolia</button></>
            : 'Connect a wallet to read or write your on-chain goal.'}
        </p>
      ) : (
        <>
          {offchainBalance != null && (
            <p className="big">
              {formatNgn(offchainBalance)} <span>off-chain · Recorded on-chain: {formatNgn(onchainTotal)} · difference {formatNgn(difference)}</span>
            </p>
          )}
          {goal?.active ? (
            <p className="big">{formatNgn(goal.totalContributed)} <span>recorded of {formatNgn(goal.targetAmount)} · due {formatDate(new Date(goal.targetDate * 1000))}</span></p>
          ) : <p>No active on-chain goal for this wallet yet.</p>}
          <div className="form">
            <label>Target amount<input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
            <label>Target date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <button disabled={busy || !(Number(target) > 0) || !date}
              onClick={() => run('Create goal', (cb) => createGoal(signer, target, Math.floor(new Date(date).getTime() / 1000), cb))}>
              {busy ? 'Working…' : goal?.active ? 'Replace goal' : 'Create goal'}
            </button>
          </div>
          {goal?.active && <p className="muted">Replacing the goal resets the recorded total to 0.</p>}
          {goal?.active && (
            <div className="form">
              <label>Contribution to record<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <button disabled={busy || !(Number(amount) > 0)} onClick={() => run('Record contribution', (cb) => recordContribution(signer, amount, cb))}>
                Record contribution
              </button>
            </div>
          )}
        </>
      )}
      {msg && (
        <p className={`status ${msg.kind}`} role={msg.kind === 'err' ? 'alert' : 'status'}>
          {msg.text} {msg.hash && <a href={txLink(msg.hash)} target="_blank" rel="noreferrer">View transaction</a>}
        </p>
      )}
    </section>
  )
}
