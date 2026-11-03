const fmt = (n, cur = 'NGN') => (n == null ? '—' : `${cur} ${Number(n).toLocaleString()}`)

export function HouseholdPanel({ household, currency }) {
  return (
    <section className="panel bank">
      <h2>Household</h2>
      <ul className="rows">
        {household.members.map((m) => (
          <li key={m.id}><span>{m.name}, age {m.age}</span><b>{fmt(m.monthly_income, currency)} / month</b></li>
        ))}
      </ul>
      <p className="muted">Combined monthly income {fmt(household.monthlyIncome, currency)}.</p>
    </section>
  )
}

export function GoalPanel({ goal, savings, currency }) {
  const pct = Math.max(0, Math.min(100, Math.round(goal.progress ?? 0)))
  return (
    <section className="panel bank">
      <h2>{goal.name}</h2>
      <p className="muted">{goal.purpose}</p>
      <p className="big">{fmt(savings.currentBalance, currency)} <span>of {fmt(goal.targetAmount, currency)}</span></p>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pct}%` }} /></div>
      <p className="muted">{pct}% saved · {fmt(goal.amountRemaining, currency)} to go · target date {goal.targetDate} ({goal.monthsRemaining} months left)</p>
      <ul className="rows">
        <li><span>Status</span><b>{String(goal.status).replace(/_/g, ' ')}</b></li>
        <li><span>Planned monthly contribution</span><b>{fmt(savings.plannedMonthly, currency)}</b></li>
        <li><span>Now needed per month</span><b>{fmt(goal.requiredMonthly, currency)}</b></li>
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
        <li><span>Current balance</span><b>{fmt(savings.currentBalance, currency)}</b></li>
        <li><span>Total contributed</span><b>{fmt(savings.totalContributed, currency)}</b></li>
        <li><span>Total withdrawn</span><b>{fmt(savings.totalWithdrawn, currency)}</b></li>
        <li><span>Monthly target</span><b>{fmt(savings.plannedMonthly, currency)}</b></li>
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
                  <td>{c.month}</td>
                  <td>{Number(c.planned).toLocaleString()}</td>
                  <td>{Number(c.amount).toLocaleString()}</td>
                  <td>{Number(c.balanceAfter).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function TransactionsPanel({ transactions }) {
  return (
    <section className="panel bank">
      <h2>Recent transactions</h2>
      {transactions.length === 0 ? <p className="muted">No transactions found.</p> : (
        <ul className="rows">
          {transactions.map((t) => {
            const out = t.type === 'expense' || t.type === 'debit'
            return (
              <li key={t.id}>
                <span>{t.date} · {t.description} <span className="muted">({t.category})</span></span>
                <b className={out ? 'debit' : 'credit'}>{out ? '−' : '+'}{Number(t.amount).toLocaleString()}</b>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
