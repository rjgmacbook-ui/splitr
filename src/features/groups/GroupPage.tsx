import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { SplitBar } from '@/components/SplitBar'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useGroup, useGroupMembers, useGroupBalances } from '@/hooks/useGroups'
import { useGroupExpenses } from '@/hooks/useExpenses'
import { formatMoneyAbs, formatMinorToDecimal } from '@/lib/money'
import { getCategoryIcon, CATEGORIES } from '@/lib/categories'
import type { Profile } from '@/types/database'

function toDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function GroupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: group, isLoading: loadingGroup } = useGroup(id)
  const { data: members = [] } = useGroupMembers(id)
  const { data: balances = [] } = useGroupBalances(id)
  const { data: allExpenses = [] } = useGroupExpenses(id)

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>()
    for (const m of members) map.set(m.user_id, m.profile)
    return map
  }, [members])

  const getProfileName = (uid: string) => profileMap.get(uid)?.display_name ?? 'Unknown'
  const getProfileColor = (uid: string) => profileMap.get(uid)?.color ?? 0

  const userBalance = balances.find((b) => b.user_id === userId)
  const net = userBalance?.net_minor ?? 0

  const sortedExpenses = useMemo(
    () => [...allExpenses].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [allExpenses]
  )

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const expenses = useMemo(() => {
    let filtered = sortedExpenses
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.payers.some((p) => getProfileName(p.user_id).toLowerCase().includes(q))
      )
    }
    if (filterCat) {
      filtered = filtered.filter((e) => e.category === filterCat)
    }
    return filtered
  }, [sortedExpenses, search, filterCat, profileMap])

  const dateGroups = useMemo(() => {
    const map = new Map<string, typeof expenses>()
    for (const exp of expenses) {
      const key = toDateKey(exp.expense_date)
      const existing = map.get(key)
      if (existing) existing.push(exp)
      else map.set(key, [exp])
    }
    return map
  }, [expenses])

  const sortedDates = useMemo(
    () => [...dateGroups.keys()].sort((a, b) => b.localeCompare(a)),
    [dateGroups]
  )

  function exportCSV() {
    if (!group) return
    const header = 'Date,Description,Category,Amount,Paid By,Is Payment'
    const rows = sortedExpenses.map((e) => {
      const payers = e.payers.map((p) => `${getProfileName(p.user_id)} (₹${formatMinorToDecimal(p.paid_minor)})`).join('; ')
      const cat = CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category
      return [
        e.expense_date,
        `"${e.description.replace(/"/g, '""')}"`,
        cat,
        formatMinorToDecimal(e.amount_minor),
        `"${payers}"`,
        e.is_payment ? 'Yes' : 'No',
      ].join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${group.name.replace(/\s+/g, '-').toLowerCase()}-expenses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loadingGroup) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="px-4 pt-6">
        <p className="text-ink-secondary">Group not found.</p>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-2">
        <Link
          to="/"
          className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full
                     text-ink-secondary hover:text-ink hover:bg-ink/5 transition-colors"
          aria-label="Back to home"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 15L7.5 10l5-5" />
          </svg>
        </Link>
        <span className="text-lg leading-none shrink-0" aria-hidden="true">
          {group.icon ?? '👥'}
        </span>
        <h1 className="font-display text-xl font-semibold text-ink truncate flex-1">
          {group.name}
        </h1>
        <Link
          to={`/groups/${id}/settings`}
          className="w-9 h-9 flex items-center justify-center rounded-full
                     text-ink-secondary hover:text-ink hover:bg-ink/5 transition-colors"
          aria-label="Group settings"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
               strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="2.5" />
            <path d="M16.2 12.2a1.2 1.2 0 00.2 1.3l.1.1a1.5 1.5 0 11-2.1 2.1l-.1-.1a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.7 1.1v.2a1.5 1.5 0 01-3 0v-.1a1.2 1.2 0 00-.8-1.1 1.2 1.2 0 00-1.3.2l-.1.1a1.5 1.5 0 11-2.1-2.1l.1-.1a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.7h-.2a1.5 1.5 0 010-3h.1a1.2 1.2 0 001.1-.8 1.2 1.2 0 00-.2-1.3l-.1-.1a1.5 1.5 0 112.1-2.1l.1.1a1.2 1.2 0 001.3.2h.1a1.2 1.2 0 00.7-1.1v-.2a1.5 1.5 0 013 0v.1a1.2 1.2 0 00.7 1.1 1.2 1.2 0 001.3-.2l.1-.1a1.5 1.5 0 112.1 2.1l-.1.1a1.2 1.2 0 00-.2 1.3v.1a1.2 1.2 0 001.1.7h.2a1.5 1.5 0 010 3h-.1a1.2 1.2 0 00-1.1.7z" />
          </svg>
        </Link>
      </header>

      {/* Balance card */}
      <div className="px-4 mb-4">
        <div className="bg-surface border border-border rounded-card p-5">
          <div className="text-center mb-3">
            <p className="text-ink-secondary text-sm mb-1">
              {net > 0 ? 'You are owed' : net < 0 ? 'You owe' : 'All settled up'}
            </p>
            <p
              className={`font-display text-[28px] font-semibold money leading-tight
                ${net > 0 ? 'text-positive' : net < 0 ? 'text-negative' : 'text-positive'}`}
            >
              {net !== 0 ? formatMoneyAbs(net) : '₹0.00'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            {balances
              .filter((b) => b.user_id !== userId && b.net_minor !== 0)
              .map((b) => {
                const name = getProfileName(b.user_id)
                const theirNet = b.net_minor
                return (
                  <div key={b.user_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar name={name} colorIndex={getProfileColor(b.user_id)} size="sm" />
                      <span className="text-ink">{name}</span>
                    </div>
                    <span
                      className={`money font-medium ${theirNet < 0 ? 'text-negative' : 'text-positive'}`}
                    >
                      {theirNet < 0
                        ? `owes ${formatMoneyAbs(theirNet)}`
                        : `gets back ${formatMoneyAbs(theirNet)}`}
                    </span>
                  </div>
                )
              })}
          </div>

          <div className="flex gap-2">
            <Link
              to={`/groups/${id}/balances`}
              className="flex-1 h-10 rounded-pill border border-border
                         flex items-center justify-center text-sm font-medium text-ink
                         hover:border-primary/30 transition-colors"
            >
              View balances
            </Link>
            <Link
              to={`/groups/${id}/settle`}
              className="flex-1 h-10 rounded-pill bg-primary text-on-primary
                         flex items-center justify-center text-sm font-semibold
                         hover:bg-primary-hover active:scale-[0.97] transition-all"
            >
              Settle up
            </Link>
          </div>
        </div>
      </div>

      {/* Member row */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {members.map((m) => (
            <div key={m.user_id} className="flex flex-col items-center gap-1 shrink-0">
              <Avatar name={m.profile.display_name} colorIndex={m.profile.color} size="sm" />
              <span className="text-[10px] text-ink-secondary leading-none">
                {m.user_id === userId ? 'You' : m.profile.display_name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filters */}
      {sortedExpenses.length > 0 && (
        <div className="px-4 mb-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary pointer-events-none"
              >
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-border rounded-pill pl-9 pr-3 py-2 text-sm
                           text-ink placeholder:text-ink-secondary/50
                           focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all shrink-0
                         ${showFilters || filterCat
                           ? 'border-primary bg-primary/10 text-primary'
                           : 'border-border text-ink-secondary hover:border-primary/30'}`}
              aria-label="Toggle filters"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h12M4 8h8M6 12h4" />
              </svg>
            </button>
            <button
              onClick={exportCSV}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border
                         text-ink-secondary hover:border-primary/30 transition-all shrink-0"
              aria-label="Export CSV"
              title="Export expenses as CSV"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8M4 7l4 4 4-4M2 13h12" />
              </svg>
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setFilterCat(null)}
                className={`shrink-0 px-2.5 py-1 rounded-pill text-xs font-medium transition-all
                           ${!filterCat
                             ? 'bg-primary text-on-primary'
                             : 'bg-ink/5 text-ink-secondary hover:bg-ink/10'}`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCat(filterCat === cat.value ? null : cat.value)}
                  className={`shrink-0 px-2.5 py-1 rounded-pill text-xs font-medium transition-all
                             ${filterCat === cat.value
                               ? 'bg-primary text-on-primary'
                               : 'bg-ink/5 text-ink-secondary hover:bg-ink/10'}`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expense feed */}
      {sortedExpenses.length === 0 ? (
        <div className="px-4">
          <EmptyState
            message="No expenses yet — add the first one."
            action={{
              label: 'Add expense',
              onClick: () => navigate(`/expenses/new?group=${id}`),
            }}
          />
        </div>
      ) : expenses.length === 0 ? (
        <div className="px-4">
          <EmptyState message="No expenses match your search." />
        </div>
      ) : (
        <div className="flex flex-col">
          {sortedDates.map((date) => {
            const dateExpenses = dateGroups.get(date)!
            return (
              <div key={date}>
                <div className="sticky top-0 z-10 px-4 py-2 bg-bg/90 backdrop-blur-sm">
                  <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wider">
                    {formatDate(date)}
                  </p>
                </div>

                <div className="px-4 flex flex-col gap-2 mb-2">
                  {dateExpenses.map((exp) => {
                    if (exp.is_payment) {
                      const payerName = getProfileName(exp.payers[0]?.user_id ?? '')
                      const payeeName = getProfileName(exp.shares[0]?.user_id ?? '')
                      return (
                        <Link
                          key={exp.id}
                          to={`/expenses/${exp.id}`}
                          className="bg-surface border border-border rounded-card p-3.5
                                     hover:border-primary/30 transition-colors block"
                        >
                          <div className="flex items-center gap-2.5">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="7" fill="var(--color-positive)" opacity="0.15" />
                              <path d="M5 8.5l2 2 4-4.5" stroke="var(--color-positive)" strokeWidth="1.7"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ink">
                                <span className="font-medium">
                                  {payerName === getProfileName(userId) ? 'You' : payerName}
                                </span>
                                {' paid '}
                                <span className="font-medium">
                                  {payeeName === getProfileName(userId) ? 'you' : payeeName}
                                </span>
                              </p>
                              <p className="text-[11px] text-ink-secondary/60 mt-0.5">{formatTime(exp.expense_date)}</p>
                            </div>
                            <span className="text-positive font-semibold text-sm money shrink-0">
                              {formatMoneyAbs(exp.amount_minor)}
                            </span>
                          </div>
                        </Link>
                      )
                    }

                    const payerNames = exp.payers
                      .map((p) => (p.user_id === userId ? 'You' : getProfileName(p.user_id)))
                      .join(', ')

                    const segments = exp.shares.map((s) => ({
                      colorIndex: getProfileColor(s.user_id),
                      amount: s.owed_minor,
                    }))

                    return (
                      <Link
                        key={exp.id}
                        to={`/expenses/${exp.id}`}
                        className="bg-surface border border-border rounded-card p-3.5
                                   hover:border-primary/30 transition-colors block"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden="true">
                            {getCategoryIcon(exp.category)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-sm font-medium text-ink truncate">
                                {exp.description}
                              </p>
                              <span className="text-sm font-semibold text-ink money shrink-0">
                                {formatMoneyAbs(exp.amount_minor)}
                              </span>
                            </div>
                            <p className="text-xs text-ink-secondary mt-0.5">
                              {payerNames} paid
                              <span className="mx-1 opacity-40">·</span>
                              {formatTime(exp.expense_date)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2.5 ml-7">
                          <SplitBar segments={segments} height={5} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
