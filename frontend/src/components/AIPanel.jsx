import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { analyseSavings } from '../lib/ai'
import { paceSummary } from '../lib/pace'
import { formatNgn } from '../lib/savingsContract'

const BADGES = {
  live: { label: 'Live AI', live: true, reason: 'Live AI generated from your dashboard data.' },
  backendmock: { label: 'Live AI', live: true, reason: 'Response came from the backend.' },
  mockapi: { label: 'Fallback', live: false, reason: 'Live AI unavailable, showing the Apidog sample analysis.' },
  mock: { label: 'Fallback', live: false, reason: 'Live AI unavailable, showing built-in analysis.' },
  fallback: { label: 'Fallback', live: false, reason: 'Live AI unavailable, showing built-in analysis.' },
}

const titleCase = (s) => String(s || 'other').replace(/(^|\s)\w/g, (c) => c.toUpperCase())

const Skeleton = () => (
  <div aria-hidden="true">
    {[90, 70, 80].map((w, i) => (
      <div key={i} className="skeleton" style={{ width: `${w}%` }} />
    ))}
  </div>
)

export default function AIPanel({ data }) {
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState(null)
  const [error, setError] = useState(null)
  const ctrl = useRef(null)
  const [slot, setSlot] = useState(null)

  useEffect(() => {
    setSlot(document.getElementById('ai-badge-slot'))
  }, [])

  const run = useCallback(() => {
    ctrl.current?.abort()
    const controller = new AbortController()
    ctrl.current = controller
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const result = await analyseSavings(data, { signal: controller.signal })
        if (!controller.signal.aborted) setInsight(result)
      } catch (e) {
        if (!controller.signal.aborted && e?.name !== 'AbortError') {
          setError('Could not load insights. Refresh to try the fallback again.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return controller
  }, [data])

  useEffect(() => {
    if (!data) return
    const controller = run()
    return () => controller.abort()
  }, [data, run])

  const history = data?.savings?.contributions || []
  const pace = paceSummary({ goal: data?.goal, savings: data?.savings })
  const monthsMet = history.filter((c) => Number(c.amount) >= Number(c.planned)).length
  let longestStreak = 0
  let streak = 0
  for (const c of history) {
    streak = Number(c.amount) >= Number(c.planned) ? streak + 1 : 0
    longestStreak = Math.max(longestStreak, streak)
  }
  const balance = Number(data?.savings?.currentBalance) || 0
  const target = Number(data?.goal?.targetAmount) || 0
  const progressPct = target ? Math.round((balance / target) * 100) : 0
  const top = data?.expenses?.byCategory?.[0]
  const prefillAmount = pace.onTrack
    ? data?.savings?.plannedMonthly
    : pace.catchUpPerMonth || pace.requiredMonthly
  const action = insight?.suggestedAction?.label || insight?.recommendations?.[0]?.title || null

  const scrollToOnchain = () => {
    window.dispatchEvent(
      new CustomEvent('record-contribution', { detail: { amount: prefillAmount } }),
    )
    document.getElementById('onchain-panel')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const badge = BADGES[insight?.source] || BADGES.fallback

  return (
    <section className="panel ai-panel" aria-busy={loading}>
      <div className="section-head ai-head">
        <div>
          <p className="eyebrow">Insights</p>
          <h2>AI insights</h2>
          <p className="section-sub">Plain-English analysis of your pace, spending and next steps.</p>
        </div>
        <span className={`pill ${badge.live ? 'live' : 'fallback'}`} title={badge.reason}>
          {badge.label}
        </span>
      </div>
      {insight && slot && createPortal(
        <span className={`pill ${badge.live ? 'live' : 'fallback'}`} title={badge.reason}>
          {badge.label}
        </span>,
        slot,
      )}
      {loading && <Skeleton />}
      {error && <p className="err" role="alert">{error}</p>}
      {!loading && insight && (
        <>
          <p className="big ai-summary">{insight.summary}</p>
          <div className="ai-groups">
            <div className="ai-group">
              <h3 className="subhead">Consistency</h3>
              <p>Met {monthsMet} of {history.length} months, longest streak {longestStreak}.</p>
            </div>

            <div className="ai-group">
              <h3 className="subhead">Spending patterns</h3>
              <p>
                {top
                  ? `Top category is ${titleCase(top.category)} at ${top.share}% of ${formatNgn(data.expenses?.monthlyTotal)} monthly expenses.`
                  : 'No expense data available.'}
              </p>
            </div>

            <div className="ai-group">
              <h3 className="subhead">Progress</h3>
              <p>{formatNgn(balance)} saved, {progressPct}% of goal.</p>
            </div>

            <div className="ai-group">
              <h3 className="subhead">Recommendations</h3>
              {insight.recommendations.length > 0 ? (
                <ul>
                  {insight.recommendations.map((r, i) => (
                    <li key={i}><b>{r.title}.</b> {r.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No recommendations returned.</p>
              )}
            </div>

            <div className="ai-group">
              <h3 className="subhead">Next actions</h3>
              {action ? (
                Number(prefillAmount) > 0 ? (
                  <button onClick={scrollToOnchain}>{action}</button>
                ) : (
                  <p>{action}</p>
                )
              ) : (
                <p className="muted">No next action returned.</p>
              )}
            </div>
          </div>

          <p className="muted ai-meta">
            {insight.meta?.confidence && `Confidence: ${insight.meta.confidence}. `}
            {insight.meta?.disclaimer || 'Suggestions only, not financial advice or a guaranteed outcome.'}
          </p>
        </>
      )}
      <button disabled={loading} onClick={run}>
        {loading ? 'Analysing…' : 'Refresh insights'}
      </button>
    </section>
  )
}
