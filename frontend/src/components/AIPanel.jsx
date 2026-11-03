import { useState } from 'react'
import { analyseSavings } from '../lib/ai'

const LABELS = {
  live: 'AI-generated from the data above.',
  mockapi: 'Sample response from the mock API. It is fixed text, not generated from this data.',
  backendmock: 'Placeholder from the backend (AI is not set to live).',
  mock: 'Local placeholder: simple rules, no AI service connected.',
  fallback: 'The AI service was unavailable, so this is a local placeholder.',
}

const money = (n, c) => `${c || ''} ${Number(n).toLocaleString()}`.trim()
const FIGURES = (f) => [
  ['Required per month', f.requiredMonthly != null && money(f.requiredMonthly, f.currency)],
  ['Current monthly contribution', f.monthlySavingsContribution != null && money(f.monthlySavingsContribution, f.currency)],
  ['Monthly gap', f.monthlyGap != null && money(f.monthlyGap, f.currency)],
  ['Projected balance at current pace', f.projectedBalanceAtCurrentPace != null && money(f.projectedBalanceAtCurrentPace, f.currency)],
  ['Projected shortfall', f.projectedShortfall != null && money(f.projectedShortfall, f.currency)],
  ['Share of plan met', f.percentOfPlanMet != null && `${f.percentOfPlanMet}%`],
].filter(([, v]) => v)

export default function AIPanel({ data }) {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState(null)
  const run = async () => {
    setLoading(true)
    setInsight(await analyseSavings(data))
    setLoading(false)
  }
  return (
    <section className="panel">
      <h2>Savings insights</h2>
      {!insight ? <p className="muted">Get suggestions based on the simulated data on the left.</p> : (
        <>
          <p>{insight.summary}</p>
          {insight.observations.length > 0 && (
            <ul>{insight.observations.map((o, i) => <li key={i}><b>{o.type}:</b> {o.message}</li>)}</ul>
          )}
          {insight.recommendations.length > 0 && (
            <ul>{insight.recommendations.map((r, i) => <li key={i}><b>{r.title}.</b> {r.description}</li>)}</ul>
          )}
          {insight.facts && FIGURES(insight.facts).length > 0 && (
            <ul className="rows">{FIGURES(insight.facts).map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}</ul>
          )}
          {insight.suggestedAction && <p><b>Suggested next step:</b> {insight.suggestedAction.label}</p>}
          <p className="muted">{LABELS[insight.source]} {insight.meta?.confidence && `Confidence: ${insight.meta.confidence}. `}{insight.meta?.disclaimer || 'Suggestions only, not financial advice or a guaranteed outcome.'}</p>
        </>
      )}
      <button disabled={loading} onClick={run}>{loading ? 'Analysing…' : insight ? 'Refresh insights' : 'Get insights'}</button>
    </section>
  )
}
