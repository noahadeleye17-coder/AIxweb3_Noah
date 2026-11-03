import { formatDate, formatMoney, formatMonth } from '../lib/format'

const PLAN_MONTHS = 12
const titleCase = (s) => String(s || 'other').replace(/(^|\s)\w/g, (c) => c.toUpperCase())
const percent = (n) =>
  n == null ? '—' : Number(n).toLocaleString('en-NG', { maximumFractionDigits: 1 })

export function MoneyStrip({ household, expenses, savings, currency }) {
  const income = household.monthlyIncome || 0
  const expenseTotal = expenses?.monthlyTotal || 0
  const latestSaving = savings.contributions.at(-1)?.amount ?? 0
  const expensePct = income ? Math.min(100, Math.round((expenseTotal / income) * 100)) : 0
  const savingPct = income
    ? Math.min(100 - expensePct, Math.round((latestSaving / income) * 100))
    : 0
  const unallocated = Math.max(income - expenseTotal - latestSaving, 0)

  return (
    <section className="panel bank" aria-label="Monthly money flow">
      <h2>This month at a glance</h2>
      <div className="money-strip">
        <div><span>Income</span><b>{formatMoney(income, currency)}</b></div>
        <div><span>Expenses</span><b>{formatMoney(expenseTotal, currency)}</b></div>
        <div><span>Latest saving</span><b>{formatMoney(latestSaving, currency)}</b></div>
      </div>
      <div
        className="flowbar"
        role="img"
        aria-label={`Expenses are ${expensePct}% and the latest saving is ${savingPct}% of monthly income.`}
      >
        <i className="flow-expense" style={{ width: `${expensePct}%` }} />
        <i className="flow-save" style={{ width: `${savingPct}%` }} />
      </div>
      <p className="muted">
        Expenses {expensePct}% · latest saving {savingPct}% · unallocated{' '}
        {formatMoney(unallocated, currency)} of income.
      </p>
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
            <b>{formatMoney(m.monthlyIncome, currency)} / month</b>
          </li>
        ))}
      </ul>
      <p className="muted">Combined monthly income {formatMoney(household.monthlyIncome, currency)}.</p>

      <h3 className="subhead">Monthly expenses</h3>
      {expenses?.monthlyTotal > 0 ? (
        <>
          <ul className="rows">
            {expenses.byCategory.map((cat) => (
              <li key={cat.category}>
                <span>{titleCase(cat.category)} <span className="muted">({cat.share}%)</span></span>
                <b>{formatMoney(cat.monthlyTotal, currency)}</b>
              </li>
            ))}
          </ul>
          <p className="muted">
            Total {formatMoney(expenses.monthlyTotal, currency)}
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
  const planMonth = Math.min(recordedMonths, PLAN_MONTHS)
  const position = recordedMonths === 0 ? 'Not started' : `Month ${planMonth} of ${PLAN_MONTHS}`

  return (
    <section className="panel bank">
      <h2>{goal.name}</h2>
      <p className="muted">{goal.purpose}</p>
      <p className="planline">
        <b>12-month plan</b> · {position}
        {recordedMonths > 0 && ` · ${recordedMonths} month${recordedMonths === 1 ? '' : 's'} recorded`}
      </p>
      <p className="big">
        {formatMoney(savings.currentBalance, currency)}{' '}
        <span>of {formatMoney(goal.targetAmount, currency)}</span>
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
        {percent(goal.progress)}% saved · {formatMoney(goal.amountRemaining, currency)} to go · target{' '}
        {formatDate(goal.targetDate)}
      </p>
      <ul className="rows">
        <li><span>Target</span><b>{formatMoney(goal.targetAmount, currency)}</b></li>
        <li><span>Current balance</span><b>{formatMoney(savings.currentBalance, currency)}</b></li>
        <li><span>Remaining</span><b>{formatMoney(goal.amountRemaining, currency)}</b></li>
        <li><span>Progress</span><b>{percent(goal.progress)}%</b></li>
        <li><span>Planned monthly contribution</span><b>{formatMoney(savings.plannedMonthly, currency)}</b></li>
        <li><span>Needed each month</span><b>{formatMoney(goal.requiredMonthly, currency)}</b></li>
      </ul>
    </section>
  )
}

export function ContributionsPanel({ savings, currency }) {
  const list = savings.contributions || []
  return (
    <section className="panel bank">
      <h2>Savings</h2>
      <ul className="rows">
        <li><span>Current balance</span><b>{formatMoney(savings.currentBalance, currency)}</b></li>
        <li><span>Total contributed</span><b>{formatMoney(savings.totalContributed, currency)}</b></li>
        <li><span>Total withdrawn</span><b>{formatMoney(savings.totalWithdrawn, currency)}</b></li>
        <li><span>Monthly target</span><b>{formatMoney(savings.plannedMonthly, currency)}</b></li>
        <li><span>Contribution frequency</span><b>{savings.frequency ?? '—'}</b></li>
      </ul>
      <h3 className="subhead">History</h3>
      {list.length === 0 ? <p className="muted">No history yet.</p> : (
        <div className="wrap">
          <table className="tbl">
            <thead><tr><th>Month</th><th>Planned</th><th>Actual</th><th>Balance after</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.month}>
                  <td>{formatMonth(c.month, 'numeric')}</td>
                  <td>{formatMoney(c.planned, currency)}</td>
                  <td>{formatMoney(c.amount, currency)}</td>
                  <td>{formatMoney(c.balanceAfter, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                <b className={out ? 'debit' : 'credit'}>{out ? '−' : '+'}{formatMoney(t.amount, currency)}</b>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
