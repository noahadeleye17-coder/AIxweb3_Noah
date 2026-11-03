import { useEffect, useState } from 'react'
import { useWallet } from './hooks/useWallet'
import { useDashboardData } from './hooks/useDashboardData'
import WalletBar from './components/WalletBar'
import { HouseholdPanel, GoalPanel, ContributionsPanel, TransactionsPanel, MoneyStrip, PacePanel } from './components/OffchainPanels'
import OnchainPanel from './components/OnchainPanel'
import AIPanel from './components/AIPanel'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'insights', label: 'Insights' },
  { id: 'onchain', label: 'On-chain' },
]

function SectionNav() {
  const [active, setActive] = useState('overview')

  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
    if (!sections.length || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-140px 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="section-nav" aria-label="Page sections">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={active === s.id ? 'active' : undefined}
          aria-current={active === s.id ? 'true' : undefined}
        >
          {s.label}
        </a>
      ))}
    </nav>
  )
}

export default function App() {
  const wallet = useWallet()
  const { loading, error, data, reload } = useDashboardData()
  return (
    <main>
      <header className="topbar">
        <div className="topbar-row">
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
        </div>
        <SectionNav />
      </header>
      {loading && <p>Loading dashboard…</p>}
      {error && <p className="err" role="alert">Could not load data: {error} <button onClick={reload}>Try again</button></p>}
      {data && (
        <>
          {data.source !== 'api' && (
            <p className="notice">{data.source === 'sample' ? 'Showing built-in sample data. Set VITE_API_BASE_URL in .env to use the Apidog data.' : 'Some endpoints failed, so sample data fills the gaps.'}</p>
          )}
          {data.warnings.map((w) => <p className="notice" key={w}>{w}</p>)}

          <section id="overview" className="page-section">
            <div className="section-head">
              <p className="eyebrow">Overview</p>
              <h2>Your household dashboard</h2>
              <p className="section-sub">Income, spending, goal progress and pace in one place.</p>
            </div>
            <div className="panel hero">
              <MoneyStrip
                household={data.household}
                expenses={data.expenses}
                savings={data.savings}
                currency={data.currency}
              />
              <div className="hero-main">
                <GoalPanel goal={data.goal} savings={data.savings} currency={data.currency} />
                <PacePanel goal={data.goal} savings={data.savings} />
              </div>
              <HouseholdPanel
                household={data.household}
                expenses={data.expenses}
                currency={data.currency}
              />
            </div>
          </section>

          <section id="activity" className="page-section">
            <div className="section-head">
              <p className="eyebrow">Activity</p>
              <h2>Savings activity</h2>
              <p className="section-sub">How each month compares with the plan, plus your latest transactions.</p>
            </div>
            <div className="activity-stack">
              <ContributionsPanel savings={data.savings} currency={data.currency} />
              <TransactionsPanel transactions={data.transactions} currency={data.currency} />
            </div>
          </section>

          <section id="insights" className="page-section">
            <AIPanel data={data} />
          </section>

          <section id="onchain" className="page-section">
            <OnchainPanel
              wallet={wallet}
              defaults={{ targetAmount: data.goal.targetAmount, targetDate: data.goal.targetDate }}
            />
          </section>
        </>
      )}
    </main>
  )
}
