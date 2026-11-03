import { formatDate, formatMonth } from '../lib/format'
import { formatNgn } from '../lib/savingsContract'
import { paceSummary } from '../lib/pace'

const titleCase = (s) => String(s || 'other').replace(/(^|\s)\w/g, (c) => c.toUpperCase())
const percent = (n) =>
  n == null ? '—' : Number(n).toLocaleString('en-NG', { maximumFractionDigits: 1 })

export function MoneyStrip({ household, expenses, savings }) {
  const income = household.monthlyIncome || 0
  const expenseTotal = expenses?.monthlyTotal || 0
  const savingsRate = income
    ? Math.max(0, Math.round(((income - expenseTotal) / income) * 100))
    : 0

  return (
    <div className="kpi-grid" aria-label="Monthly money flow">
      <div className="kpi"><span>Monthly income</span><b>{formatNgn(income)}</b></div>
      <div className="kpi"><span>Monthly expenses</span><b>{formatNgn(expenseTotal)}</b></div>
      <div className="kpi"><span>Savings rate</span><b>{savingsRate}%</b></div>
      <div className="kpi"><span>Current balance</span><b>{formatNgn(savings.currentBalance)}</b></div>
    </div>
  )
}

export function PacePanel({ goal, savings }) {
  const pace = paceSummary({ goal, savings })
  const recordAmount = pace.onTrack
    ? savings.plannedMonthly
    : pace.catchUpPerMonth || pace.requiredMonthly

  const record = () => {
    window.dispatchEvent(
      new CustomEvent('record-contribution', { detail: { amount: recordAmount } }),
    )
    document.getElementById('onchain-panel')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const status = pace.goalReached ? 'Goal reached' : pace.onTrack ? 'On track' : 'Behind'

  return (
    <div className="pace-card">
      <div className="pace-head">
        <p className="mini-label">Pace status</p>
        <span className={`pill ${pace.goalReached || pace.onTrack ? 'on-track' : 'behind'}`}>
          {status}
        </span>
      </div>
      {!pace.goalReached && !pace.onTrack && (
        <p className="pace-behind">
          Behind by {formatNgn(pace.behindBy)} · add {formatNgn(pace.catchUpPerMonth)} per month
        </p>
      )}
      <dl className="pace-facts">
        <div>
          <dt>Required each month</dt>
          <dd>{formatNgn(pace.requiredMonthly)}</dd>
        </div>
        <div>
          <dt>Current pace</dt>
          <dd>{formatNgn(pace.actualAverage)}</dd>
        </div>
        <div>
          <dt>Projected finish</dt>
          <dd>
            {pace.goalReached
              ? 'Goal reached'
              : pace.projectedFinishDate
                ? formatDate(pace.projectedFinishDate)
                : 'No contributions yet'}
          </dd>
        </div>
      </dl>
      {!pace.goalReached && (
        <button onClick={record}>Record this month's contribution</button>
      )}
    </div>
  )
}

export function HouseholdPanel({ household, expenses, currency }) {
  return (
    <div className="expense-card">
      <div className="expense-members">
        <h3 className="subhead">Household</h3>
        <ul className="rows compact">
          {household.members.map((m) => (
            <li key={m.id || m.name}>
              <span>{m.name}{m.age ? `, age ${m.age}` : ''}</span>
              <b>{formatNgn(m.monthlyIncome, currency)} / month</b>
            </li>
          ))}
        </ul>
        <p className="muted">Combined monthly income {formatNgn(household.monthlyIncome, currency)}.</p>
      </div>

      <div className="expense-breakdown">
        <h3 className="subhead">Expenses by category</h3>
        {expenses?.monthlyTotal > 0 ? (
          <>
            <ul className="rows compact">
              {expenses.byCategory.map((cat) => (
                <li key={cat.category}>
                  <span>{titleCase(cat.category)} <span className="muted">({cat.share}%)</span></span>
                  <b>{formatNgn(cat.monthlyTotal, currency)}</b>
                </li>
              ))}
            </ul>
            <p className="muted">
              Total {formatNgn(expenses.monthlyTotal, currency)}
              {expenses.monthsCovered > 0 &&
                ` · averaged over ${expenses.monthsCovered} month${expenses.monthsCovered === 1 ? '' : 's'} of transactions`}
              .
            </p>
          </>
        ) : (
          <p className="muted">No expense transactions in the current data.</p>
        )}
      </div>
    </div>
  )
}

export function GoalPanel({ goal, savings, currency }) {
  const pct = Math.max(0, Math.min(100, Math.round(goal.progress ?? 0)))
  const recordedMonths = savings.contributions.length
  const monthsRemaining = Number(goal.monthsRemaining) || 0
  const planMonths = Number(goal.planMonths) || recordedMonths + monthsRemaining || recordedMonths || 1
  const planMonth = Number(goal.planMonth) || Math.min(recordedMonths || 1, planMonths)

  return (
    <div className="hero-goal">
      <div className="hero-goal-head">
        <div>
          <p className="mini-label">Goal progress</p>
          <h3>{goal.name}</h3>
        </div>
        <p className="muted">{goal.purpose}</p>
      </div>
      <p className="big goal-amount">
        {formatNgn(savings.currentBalance, currency)}{' '}
        <span>of {formatNgn(goal.targetAmount, currency)}</span>
      </p>
      <div
        className="bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`${percent(goal.progress)}% of the savings goal reached`}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="goal-meta">
        <div>
          <b>Month {planMonth} of {planMonths}</b>
          <em>{recordedMonths} month{recordedMonths === 1 ? '' : 's'} recorded · {percent(goal.progress)}% saved</em>
        </div>
        <div>
          <b>{formatNgn(goal.amountRemaining, currency)}</b>
          <em>remaining</em>
        </div>
        <div>
          <b>{formatDate(goal.targetDate)}</b>
          <em>target date</em>
        </div>
      </div>
    </div>
  )
}

export function ContributionsPanel({ savings, currency }) {
  const list = savings.contributions || []
  const metCount = list.filter((c) => Number(c.amount) >= Number(c.planned)).length
  let longest = 0
  let streak = 0
  for (const c of list) {
    streak = Number(c.amount) >= Number(c.planned) ? streak + 1 : 0
    longest = Math.max(longest, streak)
  }
  const max = Math.max(1, ...list.flatMap((c) => [Number(c.planned) || 0, Number(c.amount) || 0]))
  const W = 320
  const H = 130
  const padX = 24
  const padTop = 12
  const padBottom = 28
  const baseline = H - padBottom
  const chartW = W - padX * 2
  const groupW = list.length ? chartW / list.length : chartW
  const barW = Math.max(2, (groupW - 10) / 2)

  return (
    <div className="panel activity-chart">
      <div className="chart-head">
        <h3>Planned vs actual</h3>
        <p className="muted">Planned (blue) vs actual (emerald).</p>
      </div>
      {list.length === 0 ? <p className="muted">No history yet.</p> : (
        <>
          <svg
            className="savings-chart"
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            role="img"
            aria-label={`Actual versus planned contributions for ${list.length} months. Met ${metCount} of ${list.length}.`}
            style={{ display: 'block' }}
          >
            <line className="chart-grid" x1={padX} y1={baseline} x2={W - padX} y2={baseline} />
            {list.map((c, i) => {
              const x = padX + i * groupW + 2
              const plannedH = ((Number(c.planned) || 0) / max) * (baseline - padTop)
              const actualH = ((Number(c.amount) || 0) / max) * (baseline - padTop)
              return (
                <g key={c.month}>
                  <rect className="bar-planned" x={x} y={baseline - plannedH} width={barW} height={plannedH} rx="2" />
                  <rect className="bar-actual" x={x + barW + 2} y={baseline - actualH} width={barW} height={actualH} rx="2" />
                  <text className="chart-label" x={x + barW + 1} y={H - 8} textAnchor="middle">
                    {formatMonth(c.month, 'numeric')}
                  </text>
                </g>
              )
            })}
          </svg>
          <p className="consistency">Met {metCount} of {list.length} months, longest streak {longest}.</p>
          <details>
            <summary>Show history table</summary>
            <div className="wrap">
              <table className="tbl">
                <thead><tr><th>Month</th><th>Planned</th><th>Actual</th><th>Balance after</th></tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.month}>
                      <td>{formatMonth(c.month, 'numeric')}</td>
                      <td>{formatNgn(c.planned, currency)}</td>
                      <td>{formatNgn(c.amount, currency)}</td>
                      <td>{formatNgn(c.balanceAfter, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      <dl className="savings-facts">
        <div><dt>Current balance</dt><dd>{formatNgn(savings.currentBalance, currency)}</dd></div>
        <div><dt>Total contributed</dt><dd>{formatNgn(savings.totalContributed, currency)}</dd></div>
        <div><dt>Total withdrawn</dt><dd>{formatNgn(savings.totalWithdrawn, currency)}</dd></div>
        <div><dt>Monthly target</dt><dd>{formatNgn(savings.plannedMonthly, currency)}</dd></div>
        <div><dt>Contribution frequency</dt><dd>{savings.frequency ?? '—'}</dd></div>
      </dl>
    </div>
  )
}

export function TransactionsPanel({ transactions, currency }) {
  return (
    <div className="panel activity-table">
      <h3>Recent transactions</h3>
      {transactions.length === 0 ? <p className="muted">No transactions found.</p> : (
        <ul className="rows">
          {transactions.map((t) => {
            const out = t.type === 'expense' || t.type === 'debit'
            return (
              <li key={t.id}>
                <span>{formatMonth(String(t.date).slice(0, 7), 'numeric')} · {t.description} <span className="muted">({titleCase(t.category)})</span></span>
                <b className={out ? 'debit' : 'credit'}>{out ? '−' : '+'}{formatNgn(t.amount, currency)}</b>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
