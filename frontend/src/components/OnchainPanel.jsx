import { useState, useCallback, useEffect } from 'react'
import { readGoal, createGoal, recordContribution, txLink, friendlyError } from '../lib/savingsContract'

export default function OnchainPanel({ wallet, defaults }) {
  const { signer, status, wrongNetwork } = wallet
  const [goal, setGoal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { kind: 'ok' | 'err' | 'pending', text, hash? }
  const [target, setTarget] = useState(defaults.targetAmount)
  const [date, setDate] = useState(defaults.targetDate)
  const [amount, setAmount] = useState(5000)
  const ready = status === 'connected' && !wrongNetwork

  const refresh = useCallback(async () => {
    try { setGoal(await readGoal(signer)) } catch (e) { setMsg({ kind: 'err', text: friendlyError(e) }) }
  }, [signer])
  useEffect(() => { if (ready) refresh(); else setGoal(null) }, [ready, refresh])

  const run = async (label, fn) => {
    setBusy(true); setMsg({ kind: 'pending', text: `${label}: confirm in your wallet…` })
    try {
      const hash = await fn((h) => setMsg({ kind: 'pending', text: `${label}: waiting for confirmation…`, hash: h }))
      await refresh()
      setMsg({ kind: 'ok', text: `${label}: confirmed.`, hash })
    } catch (e) { setMsg({ kind: 'err', text: friendlyError(e) }) } finally { setBusy(false) }
  }

  return (
    <section className="panel chain">
      <h2>On-chain demo record</h2>
      <p className="muted">Celo Sepolia test network. These are demo records written by your wallet. No money moves and nothing here is checked against a real payment.</p>
      {!ready ? <p>{status === 'connected' ? 'Switch to Celo Sepolia to continue.' : 'Connect a wallet to read or write your on-chain goal.'}</p> : (
        <>
          {goal?.active ? (
            <p className="big">{goal.totalContributed.toString()} <span>recorded of {goal.targetAmount.toString()} · due {new Date(goal.targetDate * 1000).toLocaleDateString()}</span></p>
          ) : <p>No active on-chain goal for this wallet yet.</p>}
          <div className="form">
            <label>Target amount<input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
            <label>Target date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <button disabled={busy || !(Number(target) > 0) || !date}
              onClick={() => run('Create goal', (cb) => createGoal(signer, target, Math.floor(new Date(date).getTime() / 1000), cb))}>
              {goal?.active ? 'Replace goal' : 'Create goal'}
            </button>
          </div>
          {goal?.active && <p className="muted">Replacing the goal resets the recorded total to 0.</p>}
          {goal?.active && (
            <div className="form">
              <label>Contribution to record<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <button disabled={busy || !(Number(amount) > 0)} onClick={() => run('Record contribution', (cb) => recordContribution(signer, amount, cb))}>Record contribution</button>
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
