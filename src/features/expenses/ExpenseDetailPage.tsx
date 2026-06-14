import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExpense, useProfiles, useDeleteExpense } from '@/hooks/useExpenses'
import { formatMoneyAbs } from '@/lib/money'
import { getCategoryIcon, CATEGORIES } from '@/lib/categories'
import { Avatar } from '@/components/Avatar'
import { SplitBar } from '@/components/SplitBar'

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return { date, time }
}

export function ExpenseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: expense, isLoading } = useExpense(id)
  const deleteExpense = useDeleteExpense()

  const allUserIds = useMemo(() => {
    if (!expense) return []
    const ids = new Set<string>()
    for (const p of expense.payers) ids.add(p.user_id)
    for (const s of expense.shares) ids.add(s.user_id)
    return [...ids]
  }, [expense])

  const { data: profiles = [] } = useProfiles(allUserIds)

  const profileMap = useMemo(() => {
    const map = new Map<string, { display_name: string; color: number }>()
    for (const p of profiles) map.set(p.id, p)
    return map
  }, [profiles])

  const getProfile = (uid: string) => profileMap.get(uid)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center text-2xl">
          🔍
        </div>
        <p className="font-display text-lg font-semibold text-ink">Expense not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Go back
        </button>
      </div>
    )
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === expense.category)?.label ?? 'General'
  const categoryIcon = getCategoryIcon(expense.category)
  const totalShares = expense.shares.reduce((s, sh) => s + sh.owed_minor, 0)

  const splitSegments = expense.shares.map((sh) => ({
    colorIndex: getProfile(sh.user_id)?.color ?? 0,
    amount: sh.owed_minor,
  }))

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await deleteExpense.mutateAsync({ id: expense.id, group_id: expense.group_id })
    navigate(-1)
  }

  return (
    <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full
                     hover:bg-ink/5 active:scale-95 transition-all -ml-1"
          aria-label="Go back"
        >
          <svg
            width="20" height="20" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </button>
        <h1 className="font-display text-xl font-semibold text-ink">Expense details</h1>
      </div>

      {/* Hero Card */}
      <section
        className="bg-surface border border-border rounded-card p-5"
        style={{ animation: 'fadeSlideUp 350ms ease-out both' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-[32px] leading-none shrink-0">{categoryIcon}</span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink leading-snug">
              {expense.description}
            </h2>
            <p className="text-sm text-ink-secondary mt-0.5">
              {formatDateTime(expense.expense_date).date}
              <span className="mx-1.5 opacity-40">·</span>
              {formatDateTime(expense.expense_date).time}
            </p>
          </div>
        </div>

        <p
          className={`font-display text-[32px] font-semibold money leading-tight ${
            expense.is_payment ? 'text-positive' : 'text-ink'
          }`}
        >
          {expense.is_payment ? '+' : ''}₹{formatMoneyAbs(expense.amount_minor).replace('₹', '')}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-ink/5 text-xs font-medium text-ink-secondary">
            {categoryIcon} {categoryLabel}
          </span>
        </div>

        {expense.notes && (
          <div className="mt-4 pl-3 border-l-2 border-primary/30">
            <p className="text-sm text-ink-secondary italic">{expense.notes}</p>
          </div>
        )}
      </section>

      {/* Paid By Card */}
      <section
        className="bg-surface border border-border rounded-card p-4"
        style={{ animation: 'fadeSlideUp 350ms ease-out 60ms both' }}
      >
        <h3 className="font-display text-base font-medium text-ink mb-3">
          {expense.is_payment ? 'Payment' : 'Paid by'}
        </h3>

        {expense.is_payment ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-positive/10 flex items-center justify-center shrink-0">
              <svg
                width="18" height="18" viewBox="0 0 18 18" fill="none"
                stroke="var(--color-positive)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M4 9.5l3.5 3.5L14 5" />
              </svg>
            </div>
            <p className="text-sm text-ink">
              <span className="font-semibold">
                {getProfile(expense.payers[0]?.user_id ?? '')?.display_name ?? 'Someone'}
              </span>
              {' paid '}
              <span className="font-semibold">
                {getProfile(expense.shares[0]?.user_id ?? '')?.display_name ?? 'someone'}
              </span>
            </p>
            <span className="ml-auto text-sm font-semibold text-positive money">
              {formatMoneyAbs(expense.amount_minor)}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {expense.payers.map((payer) => {
              const profile = getProfile(payer.user_id)
              return (
                <div key={payer.user_id} className="flex items-center gap-3">
                  <Avatar
                    name={profile?.display_name ?? '?'}
                    colorIndex={profile?.color ?? 0}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink">{profile?.display_name ?? 'Unknown'}</span>
                  <span className="ml-auto text-sm text-ink-secondary money">
                    {formatMoneyAbs(payer.paid_minor)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Split Breakdown Card */}
      {!expense.is_payment && (
        <section
          className="bg-surface border border-border rounded-card p-4"
          style={{ animation: 'fadeSlideUp 350ms ease-out 120ms both' }}
        >
          <h3 className="font-display text-base font-medium text-ink mb-3">Split details</h3>

          <div className="mb-4">
            <SplitBar segments={splitSegments} height={8} />
          </div>

          <div className="flex flex-col gap-2.5">
            {expense.shares.map((share, i) => {
              const profile = getProfile(share.user_id)
              const pct = totalShares > 0 ? (share.owed_minor / totalShares) * 100 : 0
              return (
                <div
                  key={share.user_id}
                  className="flex items-center gap-3"
                  style={{ animation: `fadeSlideUp 300ms ease-out ${180 + i * 50}ms both` }}
                >
                  <Avatar
                    name={profile?.display_name ?? '?'}
                    colorIndex={profile?.color ?? 0}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">
                    {profile?.display_name ?? 'Unknown'}
                  </span>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max(pct * 0.5, 4)}px`,
                        backgroundColor: `var(--color-person-${(profile?.color ?? 0) % 8})`,
                        transition: 'width 400ms ease-out',
                      }}
                    />
                    <span className="text-sm text-ink-secondary money w-20 text-right">
                      {formatMoneyAbs(share.owed_minor)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Actions */}
      <div
        className="flex flex-col gap-2 mt-1"
        style={{ animation: 'fadeSlideUp 350ms ease-out 200ms both' }}
      >
        <button
          onClick={() => {
            navigate(`/expenses/new?edit=${expense.id}`)
          }}
          className="w-full h-11 bg-ink/5 text-ink rounded-pill text-sm font-semibold
                     hover:bg-ink/10 active:scale-[0.97] transition-all"
        >
          Edit expense
        </button>
        <button
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
          disabled={deleteExpense.isPending}
          className={`w-full h-11 rounded-pill text-sm font-semibold transition-all active:scale-[0.97]
                     ${
                       confirmDelete
                         ? 'bg-negative/10 text-negative'
                         : 'bg-transparent text-negative/70 hover:text-negative hover:bg-negative/5'
                     }`}
        >
          {deleteExpense.isPending
            ? 'Deleting…'
            : confirmDelete
              ? 'Tap again to delete'
              : 'Delete expense'}
        </button>
      </div>
    </div>
  )
}
