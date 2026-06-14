import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v9a1 1 0 001 1h3.5v-5a1.5 1.5 0 013 0v5H16a1 1 0 001-1v-9" />
    </svg>
  )
}

function GroupsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7.5" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="8.5" r="2.5" />
      <path d="M21 20c0-2.5-1.6-4.5-3.5-4.5" />
    </svg>
  )
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

function SplitLogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2" y="12" width="10" height="4" rx="2" fill="var(--color-primary)" opacity="0.85" />
      <rect x="16" y="12" width="10" height="4" rx="2" fill="var(--color-person-1)" opacity="0.85" />
      <rect x="8" y="5" width="12" height="4" rx="2" fill="var(--color-person-4)" opacity="0.7" />
      <rect x="8" y="19" width="12" height="4" rx="2" fill="var(--color-person-2)" opacity="0.7" />
    </svg>
  )
}

const navItems = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/groups', label: 'Groups', Icon: GroupsIcon, end: false },
  { to: '/account', label: 'Account', Icon: AccountIcon, end: false },
] as const

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-bg flex flex-col md:flex-row">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-[280px] shrink-0 border-r border-border bg-surface">
        <div className="flex items-center gap-2.5 px-6 pt-7 pb-6">
          <SplitLogoMark />
          <span className="font-display text-[22px] font-semibold text-ink tracking-tight">
            Splitr
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-md text-[15px] font-medium transition-colors
                ${isActive
                  ? 'text-primary bg-primary/[0.08]'
                  : 'text-ink-secondary hover:text-ink hover:bg-ink/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-4 pb-5">
          <button
            onClick={() => navigate('/expenses/new')}
            className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-on-primary
                       rounded-pill text-[15px] font-semibold
                       hover:bg-primary-hover active:scale-[0.97] transition-all
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Add expense"
          >
            <PlusIcon />
            Add expense
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Mobile FAB ── */}
      <button
        onClick={() => navigate('/expenses/new')}
        className="md:hidden fixed z-30 right-4 bottom-[calc(68px+env(safe-area-inset-bottom)+12px)]
                   flex items-center gap-1.5 h-12 px-5 bg-primary text-on-primary
                   rounded-pill text-sm font-semibold shadow-[0_2px_12px_rgba(108,92,231,0.35)]
                   hover:bg-primary-hover active:scale-[0.95] transition-all
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Add expense"
      >
        <PlusIcon />
        <span>Add</span>
      </button>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-border
                   pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch h-[60px]">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors
                ${isActive ? 'text-primary' : 'text-ink-secondary'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className={`text-[11px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
