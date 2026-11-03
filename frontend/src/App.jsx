import { useWallet } from './hooks/useWallet'
import { useDashboardData } from './hooks/useDashboardData'
import WalletBar from './components/WalletBar'
import { HouseholdPanel, GoalPanel, ContributionsPanel, TransactionsPanel } from './components/OffchainPanels'
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
          {data && <p className="muted">{data.household.name} · {data.household.location} · synthetic profile</p>}
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
          <div className="grid">
            <div className="col">
              <h3 className="colhead bank">Bank data (simulated)</h3>
              <GoalPanel goal={data.goal} savings={data.savings} currency={data.currency} />
              <HouseholdPanel household={data.household} currency={data.currency} />
              <ContributionsPanel savings={data.savings} currency={data.currency} />
              <TransactionsPanel transactions={data.transactions} />
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
