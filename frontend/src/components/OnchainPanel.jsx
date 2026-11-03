import { useState, useEffect, useRef } from 'react'
import { createGoal, recordContribution, txLink, friendlyError, formatNgn } from '../lib/savingsContract'
import { formatDate } from '../lib/format'

export default function OnchainPanel({ wallet, data, onchainGoal, refreshGoal, onGoalCreated }) {
  const { signer, status, wrongNetwork, switchNetwork } = wallet
  const goal = data?.goal
  const offchainBalance = data?.savings?.currentBalance
  const monthlyTarget = data?.savings?.plannedMonthly

  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { kind: 'ok' | 'err' | 'pending', text, hash? }
  const [target, setTarget] = useState(() => goal?.targetAmount ?? '')
  const [date, setDate] = useState(() => goal?.targetDate ?? '')
  const [amount, setAmount] = useState('')
  const lastPlanned = useRef(null)
  const ready = status === 'connected' && !wrongNetwork

  useEffect(() => {
    if (monthlyTarget == null) return
    setAmount((current) =>
      current === '' || Number(current) === Number(lastPlanned.current)
        ? String(monthlyTarget)
        : current,
    )
    lastPlanned.current = monthlyTarget
  }, [monthlyTarget])

  useEffect(() => {
    if (onchainGoal?.active) {
      setTarget(String(onchainGoal.targetAmount))
      setDate(onchainGoal.targetDate)
    }
  }, [onchainGoal?.targetAmount, onchainGoal?.targetDate])

  useEffect(() => {
    const prefills = (e) => {
      const value = Number(e.detail?.amount)
      if (value > 0) setAmount(String(Math.round(value)))
    }
    window.addEventListener('record-contribution', prefills)
    return () => window.removeEventListener('record-contribution', prefills)
  }, [])

  const run = async (label, fn, after = refreshGoal) => {
    setBusy(true); setMsg({ kind: 'pending', text: `${label}: Confirm in wallet` })
    try {
      const hash = await fn((h) => setMsg({ kind: 'pending', text: `${label}: waiting for confirmation…`, hash: h }))
      await after()
      setMsg({ kind: 'ok', text: `${label}: confirmed.`, hash })
    } catch (e) { setMsg({ kind: 'err', text: friendlyError(e) }) } finally { setBusy(false) }
  }

  const onchainTotal = onchainGoal?.totalContributed ?? 0
  const difference = Number(offchainBalance ?? 0) - Number(onchainTotal)

  return (
    <section id="onchain-panel" className="panel chain">
      <div className="section-head">
        <p className="eyebrow">On-chain</p>
        <h2>On-chain record</h2>
        <p className="section-sub">Celo Sepolia test network; the contract records numbers only, so no real money moves.</p>
      </div>
      {!ready ? (
        <p>
          {status === 'connected'
            ? <>Switch to Celo Sepolia to continue. <button onClick={switchNetwork}>Switch to Celo Sepolia</button></>
            : 'Connect a wallet to read or write your on-chain goal.'}
        </p>
      ) : (
        <>
          <div className="chain-stats">
            <div className="chain-stat">
              <span>Off-chain balance</span>
              <b>{offchainBalance != null ? formatNgn(offchainBalance) : '—'}</b>
            </div>
            <div className="chain-stat">
              <span>Recorded on-chain</span>
              <b>{formatNgn(onchainTotal)}</b>
            </div>
          </div>
          <p className="muted">Difference {formatNgn(difference)}.</p>
          {onchainGoal?.active ? (
            <p className="goal-line">{formatNgn(onchainGoal.totalContributed)} recorded of {formatNgn(goal.targetAmount)} · due {formatDate(goal.targetDate)}</p>
          ) : <p>No active on-chain goal for this wallet yet.</p>}
          <div className="form">
            <label>Target amount<input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
            <label>Target date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <button disabled={busy || !(Number(target) > 0) || !date}
              onClick={() => run(
                'Create goal',
                (cb) => createGoal(signer, target, Math.floor(new Date(date).getTime() / 1000), cb),
                () => onGoalCreated({ refreshInsights: Boolean(onchainGoal?.active) }),
              )}>
              {busy ? 'Working…' : onchainGoal?.active ? 'Replace goal' : 'Create goal'}
            </button>
          </div>
          {onchainGoal?.active && <p className="muted">Replacing the goal resets the recorded total to 0.</p>}
          {onchainGoal?.active && (
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
