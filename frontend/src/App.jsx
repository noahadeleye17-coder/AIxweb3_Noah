import { useWallet } from './hooks/useWallet'
import { useDashboardData } from './hooks/useDashboardData'
import WalletBar from './components/WalletBar'
import { HouseholdPanel, GoalPanel, ContributionsPanel, TransactionsPanel, MoneyStrip, PacePanel } from './components/OffchainPanels'
import OnchainPanel from './components/OnchainPanel'
import AIPanel from './components/AIPanel'

export default function App() {
  const wallet = useWallet()
  const { loading, error, data, reload } = useDashboardData()
  return (
    <main>
      <header>
        <div>
          <h1>Savings goal</h1>
          {data && (
            <p className="muted">
              {data.household.name} · {data.household.location} · synthetic profile{' '}
              <span
                className={`pill ${data.source === 'api' ? 'ok' : 'warn'}`}
                title={
                  data.source === 'api'
                    ? 'All dashboard data came from the Apidog mock API.'
                    : data.source === 'partial'
                      ? 'Some API requests failed, so sample data fills the gaps.'
                      : 'The API was unavailable, so this view uses built-in sample data.'
                }
              >
                Data: {data.source === 'api' ? 'live' : 'sample'}
              </span>
            </p>
          )}
        </div>
        <WalletBar wallet={wallet} />
      </header>
      {loading && <p>Loading dashboard…</p>}
      {error && <p className="err" role="alert">Could not load data: {error} <button onClick={reload}>Try again</button></p>}
      {data && (
        <>
          {data.source !== 'api' && (
            <p className="notice">{data.source === 'sample' ? 'Showing built-in sample data. Set VITE_API_BASE_URL in .env to use the Apidog data.' : 'Some endpoints failed, so sample data fills the gaps.'}</p>
          )}
          {data.warnings.map((w) => <p className="notice" key={w}>{w}</p>)}
          <MoneyStrip
            household={data.household}
            expenses={data.expenses}
            savings={data.savings}
            currency={data.currency}
          />
          <div className="grid">
            <div className="col">
              <h3 className="colhead bank">Bank data (simulated)</h3>
              <GoalPanel goal={data.goal} savings={data.savings} currency={data.currency} />
              <PacePanel goal={data.goal} savings={data.savings} />
              <HouseholdPanel household={data.household} expenses={data.expenses} currency={data.currency} />
              <ContributionsPanel savings={data.savings} currency={data.currency} />
              <TransactionsPanel transactions={data.transactions} currency={data.currency} />
            </div>
            <div className="col">
              <h3 className="colhead chain">Blockchain (test network)</h3>
              <OnchainPanel wallet={wallet} defaults={{ targetAmount: data.goal.targetAmount, targetDate: data.goal.targetDate }} />
              <AIPanel data={data} />
            </div>
          </div>
        </>
      )}
    </main>
  )
}
