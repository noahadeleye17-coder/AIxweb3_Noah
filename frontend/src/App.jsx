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
      <header className="topbar">
        <div className="brand">
          <h1>From Intention to Habit</h1>
          <p className="brand-sub">Smart household savings</p>
        </div>
        <div className="topbar-meta">
          {data && (
            <span
              className={`pill ${data.source === 'api' ? 'live' : 'sample'}`}
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
          )}
          <span id="ai-badge-slot" />
          <WalletBar wallet={wallet} />
        </div>
      </header>
      {loading && <p>Loading dashboard…</p>}
      {error && <p className="err" role="alert">Could not load data: {error} <button onClick={reload}>Try again</button></p>}
      {data && (
        <>
          {data.source !== 'api' && (
            <p className="notice">{data.source === 'sample' ? 'Showing built-in sample data. Set VITE_API_BASE_URL in .env to use the Apidog data.' : 'Some endpoints failed, so sample data fills the gaps.'}</p>
          )}
          {data.warnings.map((w) => <p className="notice" key={w}>{w}</p>)}
          <div className="hero">
            <GoalPanel goal={data.goal} savings={data.savings} currency={data.currency} />
            <PacePanel goal={data.goal} savings={data.savings} />
          </div>
          <div className="card-grid">
            <MoneyStrip
              household={data.household}
              expenses={data.expenses}
              savings={data.savings}
              currency={data.currency}
            />
            <ContributionsPanel savings={data.savings} currency={data.currency} />
            <OnchainPanel wallet={wallet} defaults={{ targetAmount: data.goal.targetAmount, targetDate: data.goal.targetDate }} />
            <AIPanel data={data} />
            <HouseholdPanel household={data.household} expenses={data.expenses} currency={data.currency} />
            <TransactionsPanel transactions={data.transactions} currency={data.currency} />
          </div>
        </>
      )}
    </main>
  )
}
