import { formatDate, formatMonth } from '../lib/format'
import { formatNgn } from '../lib/savingsContract'
import { paceSummary } from '../lib/pace'

const titleCase = (s) => String(s || 'other').replace(/(^|\s)\w/g, (c) => c.toUpperCase())
const percent = (n) =>
  n == null ? '—' : Number(n).toLocaleString('en-NG', { maximumFractionDigits: 1 })

export function MoneyStrip({ household, expenses, savings }) {
  const income = household.monthlyIncome || 0
  const expenseTotal = expenses?.monthlyTotal || 0
  const expensePct = income ? Math.min(100, Math.round((expenseTotal / income) * 100)) : 0
  const savingsRate = income
    ? Math.max(0, Math.round(((income - expenseTotal) / income) * 100))
    : 0

  return (
    <section className="panel bank" aria-label="Monthly money flow">
      <h2>This month at a glance</h2>
      <div className="money-strip">
        <div><span>Monthly income</span><b>{formatNgn(income)}</b></div>
        <div><span>Monthly expenses</span><b>{formatNgn(expenseTotal)}</b></div>
        <div><span>Savings rate</span><b>{savingsRate}%</b></div>
      </div>
      <div
        className="flowbar"
        role="img"
        aria-label={`Expenses are ${expensePct}% and the savings rate is ${savingsRate}% of monthly income.`}
      >
        <i className="flow-expense" style={{ width: `${expensePct}%` }} />
        <i className="flow-save" style={{ width: `${savingsRate}%` }} />
      </div>
      <p className="muted">
        Expenses {expensePct}% · savings rate {savingsRate}% · planned saving{' '}
        {formatNgn(savings.plannedMonthly)} of income.
      </p>
    </section>
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

  return (
    <section className="panel bank">
      <h2>Pace</h2>
      <p className={`pill ${pace.goalReached || pace.onTrack ? 'ok' : 'warn'}`}>
        {pace.goalReached
          ? 'Goal reached'
          : pace.onTrack
            ? 'On track'
            : `Behind by ${formatNgn(pace.behindBy)}: add ${formatNgn(pace.catchUpPerMonth)} per month to finish on time`}
      </p>
      <p className="muted">
        Required {formatNgn(pace.requiredMonthly)}/month · current pace{' '}
        {formatNgn(pace.actualAverage)}/month ·{' '}
        {pace.goalReached
          ? 'goal reached'
          : pace.projectedFinishDate
            ? `projected finish ${formatDate(pace.projectedFinishDate)}`
            : 'no contributions yet'}
      </p>
      {!pace.goalReached && (
        <button onClick={record}>Record this month's contribution</button>
      )}
    </section>
  )
}

export function HouseholdPanel({ household, expenses, currency }) {
  return (
    <section className="panel bank">
      <h2>Household</h2>
      <ul className="rows">
        {household.members.map((m) => (
          <li key={m.id || m.name}>
            <span>{m.name}{m.age ? `, age ${m.age}` : ''}</span>
            <b>{formatNgn(m.monthlyIncome, currency)} / month</b>
          </li>
        ))}
      </ul>
      <p className="muted">Combined monthly income {formatNgn(household.monthlyIncome, currency)}.</p>

      <h3 className="subhead">Monthly expenses</h3>
      {expenses?.monthlyTotal > 0 ? (
        <>
          <ul className="rows">
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
    </section>
  )
}

export function GoalPanel({ goal, savings, currency }) {
  const pct = Math.max(0, Math.min(100, Math.round(goal.progress ?? 0)))
  const recordedMonths = savings.contributions.length
  const monthsRemaining = Number(goal.monthsRemaining) || 0
  const planMonths = recordedMonths + monthsRemaining || recordedMonths || 1
  const planMonth = Math.min(recordedMonths || 1, planMonths)

  return (
    <section className="panel bank">
      <h2>{goal.name}</h2>
      <p className="muted">{goal.purpose}</p>
      <p className="planline">
        <b>{planMonths}-month plan</b> · Month {planMonth} of {planMonths}
        {recordedMonths > 0 && ` · ${recordedMonths} month${recordedMonths === 1 ? '' : 's'} recorded`}
      </p>
      <p className="big">
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
      <p className="muted">
        {percent(goal.progress)}% saved · {formatNgn(goal.amountRemaining, currency)} to go · target{' '}
        {formatDate(goal.targetDate)}
      </p>
      <ul className="rows">
        <li><span>Target</span><b>{formatNgn(goal.targetAmount, currency)}</b></li>
        <li><span>Current balance</span><b>{formatNgn(savings.currentBalance, currency)}</b></li>
        <li><span>Remaining</span><b>{formatNgn(goal.amountRemaining, currency)}</b></li>
        <li><span>Progress</span><b>{percent(goal.progress)}%</b></li>
        <li><span>Planned monthly contribution</span><b>{formatNgn(savings.plannedMonthly, currency)}</b></li>
        <li><span>Needed each month</span><b>{formatNgn(goal.requiredMonthly, currency)}</b></li>
      </ul>
    </section>
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
    <section className="panel bank">
      <h2>Savings</h2>
      <ul className="rows">
        <li><span>Current balance</span><b>{formatNgn(savings.currentBalance, currency)}</b></li>
        <li><span>Total contributed</span><b>{formatNgn(savings.totalContributed, currency)}</b></li>
        <li><span>Total withdrawn</span><b>{formatNgn(savings.totalWithdrawn, currency)}</b></li>
        <li><span>Monthly target</span><b>{formatNgn(savings.plannedMonthly, currency)}</b></li>
        <li><span>Contribution frequency</span><b>{savings.frequency ?? '—'}</b></li>
      </ul>
      <h3 className="subhead">History</h3>
      {list.length === 0 ? <p className="muted">No history yet.</p> : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            role="img"
            aria-label={`Actual versus planned contributions for ${list.length} months. Met ${metCount} of ${list.length}.`}
            style={{ display: 'block' }}
          >
            <line x1={padX} y1={baseline} x2={W - padX} y2={baseline} stroke="#94a3b8" strokeWidth="1" />
            {list.map((c, i) => {
              const x = padX + i * groupW + 2
              const plannedH = ((Number(c.planned) || 0) / max) * (baseline - padTop)
              const actualH = ((Number(c.amount) || 0) / max) * (baseline - padTop)
              return (
                <g key={c.month}>
                  <rect x={x} y={baseline - plannedH} width={barW} height={plannedH} fill="#cbd5e1" />
                  <rect x={x + barW + 2} y={baseline - actualH} width={barW} height={actualH} fill="#16a34a" />
                  <text x={x + barW + 1} y={H - 8} textAnchor="middle" fontSize="9" fill="#64748b">
                    {formatMonth(c.month, 'numeric')}
                  </text>
                </g>
              )
            })}
          </svg>
          <p className="muted">Planned (grey) vs actual (green).</p>
          <p className="muted">Met {metCount} of {list.length} months, longest streak {longest}.</p>
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
    </section>
  )
}

export function TransactionsPanel({ transactions, currency }) {
  return (
    <section className="panel bank">
      <h2>Recent transactions</h2>
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
    </section>
  )
}
