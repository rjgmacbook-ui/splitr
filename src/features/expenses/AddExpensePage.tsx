import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGroups, useGroupMembers } from '@/hooks/useGroups'
import { useCreateExpense } from '@/hooks/useExpenses'
import {
  parseRupeesToMinor,
  formatMinorToDecimal,
  validatePayerSum,
  validateShareSum,
} from '@/lib/money'
import {
  splitEqually,
  splitByPercentage,
  splitByShares,
  splitByAdjustment,
} from '@/lib/split'
import type { SplitResult } from '@/lib/split'
import { CATEGORIES } from '@/lib/categories'
import { Avatar } from '@/components/Avatar'
import { SplitBar } from '@/components/SplitBar'
import type { CreateExpensePayload } from '@/types/database'

const EMPTY_MEMBERS: never[] = []

type SplitMethod = 'equal' | 'exact' | 'percent' | 'shares' | 'adjust'

const METHODS: { key: SplitMethod; label: string }[] = [
  { key: 'equal', label: 'Equal' },
  { key: 'exact', label: 'Exact' },
  { key: 'percent', label: 'Percent' },
  { key: 'shares', label: 'Shares' },
  { key: 'adjust', label: 'Adjust' },
]

export function AddExpensePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: userGroups = [], isLoading: loadingGroups } = useGroups()
  const createExpense = useCreateExpense()

  const [groupId, setGroupId] = useState(
    () => searchParams.get('group') ?? ''
  )

  useEffect(() => {
    if (!groupId && userGroups.length > 0) {
      setGroupId(userGroups[0]!.id)
    }
  }, [userGroups, groupId])

  const { data: groupMembers = EMPTY_MEMBERS } = useGroupMembers(groupId || undefined)

  // Form state
  const [description, setDescription] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [date, setDate] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [category, setCategory] = useState('general')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  // Split state
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({})
  const [percentages, setPercentages] = useState<Record<string, string>>({})
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [adjustments, setAdjustments] = useState<Record<string, string>>({})

  // Payer state
  const [multiPayer, setMultiPayer] = useState(false)
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({})

  const members = groupMembers

  const initMemberState = useCallback(() => {
    const ids = members.map((m) => m.user_id)
    setSelectedMembers(new Set(ids))
    const w: Record<string, number> = {}
    const e: Record<string, string> = {}
    const p: Record<string, string> = {}
    const a: Record<string, string> = {}
    const pa: Record<string, string> = {}
    for (const id of ids) {
      w[id] = 1
      e[id] = ''
      p[id] = ''
      a[id] = ''
      pa[id] = ''
    }
    setWeights(w)
    setExactAmounts(e)
    setPercentages(p)
    setAdjustments(a)
    setPayerAmounts(pa)
  }, [members])

  useEffect(() => {
    initMemberState()
  }, [initMemberState])

  const amountMinor = useMemo(() => parseRupeesToMinor(amountStr) ?? 0, [amountStr])

  // Split computation
  const { results: splitResults, error: splitError } = useMemo(() => {
    if (amountMinor <= 0) return { results: [] as SplitResult[], error: null as string | null }

    try {
      let results: SplitResult[]
      switch (splitMethod) {
        case 'equal': {
          const ids = [...selectedMembers]
          if (ids.length === 0) return { results: [] as SplitResult[], error: null }
          results = splitEqually(amountMinor, ids)
          break
        }
        case 'exact':
          results = members
            .map((m) => ({
              user_id: m.user_id,
              owed_minor: parseRupeesToMinor(exactAmounts[m.user_id] ?? '') ?? 0,
            }))
            .filter((r) => r.owed_minor > 0)
          break
        case 'percent': {
          const percs = members
            .map((m) => ({
              user_id: m.user_id,
              percent: parseFloat(percentages[m.user_id] ?? '0') || 0,
            }))
            .filter((p) => p.percent > 0)
          if (percs.length === 0) return { results: [] as SplitResult[], error: null }
          const pSum = percs.reduce((s, p) => s + p.percent, 0)
          if (Math.abs(pSum - 100) > 0.01) {
            results = percs.map((p) => ({
              user_id: p.user_id,
              owed_minor: Math.round((p.percent / 100) * amountMinor),
            }))
          } else {
            results = splitByPercentage(amountMinor, percs)
          }
          break
        }
        case 'shares': {
          const sh = members
            .map((m) => ({ user_id: m.user_id, weight: weights[m.user_id] ?? 0 }))
            .filter((s) => s.weight > 0)
          if (sh.length === 0) return { results: [] as SplitResult[], error: null }
          results = splitByShares(amountMinor, sh)
          break
        }
        case 'adjust': {
          const adjs = members
            .map((m) => {
              const raw = adjustments[m.user_id] ?? ''
              const isNeg = raw.startsWith('-')
              const absVal = parseRupeesToMinor(raw.replace(/^-/, '')) ?? 0
              return { user_id: m.user_id, adjustment_minor: isNeg ? -absVal : absVal }
            })
            .filter((a) => a.adjustment_minor !== 0)
          results = splitByAdjustment(
            amountMinor,
            members.map((m) => m.user_id),
            adjs
          )
          break
        }
      }
      return { results, error: null }
    } catch (err) {
      return {
        results: [] as SplitResult[],
        error: err instanceof Error ? err.message : 'Invalid split',
      }
    }
  }, [splitMethod, amountMinor, selectedMembers, exactAmounts, percentages, weights, adjustments, members])

  const splitBarSegments = useMemo(
    () =>
      splitResults.map((r) => ({
        colorIndex: members.find((m) => m.user_id === r.user_id)?.profile.color ?? 0,
        amount: r.owed_minor,
      })),
    [splitResults, members]
  )

  // Payer validation
  const payerList = useMemo(() => {
    if (!multiPayer) return [{ user_id: userId, paid_minor: amountMinor }]
    return members.map((m) => ({
      user_id: m.user_id,
      paid_minor: parseRupeesToMinor(payerAmounts[m.user_id] ?? '') ?? 0,
    }))
  }, [multiPayer, amountMinor, payerAmounts, members, userId])

  const payerSum = payerList.reduce((s, p) => s + p.paid_minor, 0)
  const isPayerValid = validatePayerSum(payerList, amountMinor)
  const isShareValid = amountMinor > 0 && validateShareSum(splitResults, amountMinor)
  const canSave = description.trim() !== '' && amountMinor > 0 && isPayerValid && isShareValid && groupId

  // Remaining indicators
  const payerRemaining = amountMinor - payerSum
  const exactTotal = members.reduce(
    (s, m) => s + (parseRupeesToMinor(exactAmounts[m.user_id] ?? '') ?? 0),
    0
  )
  const exactRemaining = amountMinor - exactTotal
  const percentTotal = members.reduce(
    (s, m) => s + (parseFloat(percentages[m.user_id] ?? '0') || 0),
    0
  )
  const percentRemaining = 100 - percentTotal

  const getOwed = (uid: string) =>
    splitResults.find((r) => r.user_id === uid)?.owed_minor ?? 0

  // Handlers
  const handleAmountInput = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) setAmountStr(value)
  }

  const handleSave = async (addAnother: boolean) => {
    if (!canSave) return
    const payload: CreateExpensePayload = {
      group_id: groupId,
      description: description.trim(),
      amount_minor: amountMinor,
      currency: 'INR',
      category,
      expense_date: new Date(date).toISOString(),
      notes: notes.trim() || null,
      is_payment: false,
      payers: payerList.filter((p) => p.paid_minor > 0),
      shares: splitResults,
    }
    await createExpense.mutateAsync(payload)
    if (addAnother) {
      setDescription('')
      setAmountStr('')
      setNotes('')
      setShowNotes(false)
      setSplitMethod('equal')
      setMultiPayer(false)
      initMemberState()
    } else {
      navigate(-1)
    }
  }

  const currentUser = members.find((m) => m.user_id === userId)

  if (loadingGroups) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
        <h1 className="font-display text-xl font-semibold text-ink">Add expense</h1>
      </div>

      {/* Group selector */}
      <div className="relative">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full bg-surface border border-border rounded-card px-4 py-3 pr-10
                     text-ink font-medium appearance-none
                     focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
        >
          {userGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.icon ?? '👥'} {g.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-secondary">
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </div>

      {/* Basic Info */}
      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-4">
        <input
          type="text"
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-bg border border-border rounded-md px-3 py-2.5 text-ink text-[15px]
                     placeholder:text-ink-secondary/50
                     focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
        />

        {/* Amount hero input */}
        <div className="flex items-baseline gap-2 bg-bg border border-border rounded-md px-3 py-2.5 transition-colors">
          <span className="text-2xl text-ink-secondary/60 font-display select-none shrink-0">
            ₹
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountStr}
            onChange={(e) => handleAmountInput(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-[36px] leading-tight font-display font-semibold
                       text-ink placeholder:text-ink-secondary/25 outline-none focus:outline-none money caret-primary"
            autoComplete="off"
          />
        </div>

        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-bg border border-border rounded-md px-3 py-2.5 text-ink text-[15px]
                     focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
        />

        {/* Category pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm
                         font-medium transition-all active:scale-95
                         ${
                           category === cat.value
                             ? 'bg-primary text-on-primary shadow-sm'
                             : 'bg-ink/5 text-ink-secondary hover:bg-ink/10'
                         }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Paid By */}
      <section className="bg-surface border border-border rounded-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-medium text-ink">Paid by</h2>
          <button
            onClick={() => setMultiPayer(!multiPayer)}
            className={`text-xs font-medium px-3 py-1 rounded-pill transition-all
                       ${
                         multiPayer
                           ? 'bg-primary/10 text-primary'
                           : 'bg-ink/5 text-ink-secondary hover:bg-ink/10'
                       }`}
          >
            {multiPayer ? 'Single payer' : 'Split payment'}
          </button>
        </div>

        {!multiPayer ? (
          <div className="flex items-center gap-3 px-1">
            {currentUser && (
              <>
                <Avatar
                  name={currentUser.profile.display_name}
                  colorIndex={currentUser.profile.color}
                  size="sm"
                />
                <span className="text-sm font-medium text-ink">
                  {currentUser.profile.display_name}
                </span>
              </>
            )}
            <span className="ml-auto text-sm text-ink-secondary money">
              ₹{amountStr || '0.00'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <Avatar
                  name={m.profile.display_name}
                  colorIndex={m.profile.color}
                  size="sm"
                />
                <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">
                  {m.profile.display_name}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-ink-secondary">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={payerAmounts[m.user_id] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '' || /^\d*\.?\d{0,2}$/.test(v))
                        setPayerAmounts((prev) => ({ ...prev, [m.user_id]: v }))
                    }}
                    className="w-20 bg-bg border border-border rounded-md px-2 py-1.5 text-sm
                               text-ink text-right money
                               focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>
              </div>
            ))}
            {amountMinor > 0 && (
              <p
                className={`text-xs font-medium text-right ${
                  payerRemaining === 0 ? 'text-positive' : 'text-negative'
                }`}
              >
                {payerRemaining === 0
                  ? '✓ Adds up'
                  : payerRemaining > 0
                    ? `₹${formatMinorToDecimal(payerRemaining)} remaining`
                    : `₹${formatMinorToDecimal(Math.abs(payerRemaining))} over`}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Split Method */}
      <section className="bg-surface border border-border rounded-card p-4">
        <h2 className="font-display text-base font-medium text-ink mb-3">Split between</h2>

        {/* Method tabs */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {METHODS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSplitMethod(tab.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-pill text-sm font-medium
                         transition-all active:scale-95
                         ${
                           splitMethod === tab.key
                             ? 'bg-primary text-on-primary shadow-sm'
                             : 'bg-ink/5 text-ink-secondary hover:bg-ink/10'
                         }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Member list per method */}
        <div className="flex flex-col gap-3">
          {/* EQUAL */}
          {splitMethod === 'equal' &&
            members.map((m) => {
              const checked = selectedMembers.has(m.user_id)
              const owed = getOwed(m.user_id)
              return (
                <label
                  key={m.user_id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedMembers((prev) => {
                        const next = new Set(prev)
                        if (next.has(m.user_id)) next.delete(m.user_id)
                        else next.add(m.user_id)
                        return next
                      })
                    }}
                    className="w-4 h-4 rounded shrink-0 accent-[var(--color-primary)]"
                  />
                  <Avatar
                    name={m.profile.display_name}
                    colorIndex={m.profile.color}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">
                    {m.profile.display_name}
                  </span>
                  {checked && amountMinor > 0 && (
                    <span className="text-sm text-ink-secondary money shrink-0">
                      ₹{formatMinorToDecimal(owed)}
                    </span>
                  )}
                </label>
              )
            })}

          {/* EXACT */}
          {splitMethod === 'exact' && (
            <>
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3">
                  <Avatar
                    name={m.profile.display_name}
                    colorIndex={m.profile.color}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">
                    {m.profile.display_name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-ink-secondary">₹</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={exactAmounts[m.user_id] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '' || /^\d*\.?\d{0,2}$/.test(v))
                          setExactAmounts((prev) => ({ ...prev, [m.user_id]: v }))
                      }}
                      className="w-20 bg-bg border border-border rounded-md px-2 py-1.5 text-sm
                                 text-ink text-right money
                                 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </div>
                </div>
              ))}
              {amountMinor > 0 && (
                <p
                  className={`text-xs font-medium text-right ${
                    exactRemaining === 0 ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {exactRemaining === 0
                    ? '✓ Adds up'
                    : exactRemaining > 0
                      ? `₹${formatMinorToDecimal(exactRemaining)} remaining`
                      : `₹${formatMinorToDecimal(Math.abs(exactRemaining))} over`}
                </p>
              )}
            </>
          )}

          {/* PERCENT */}
          {splitMethod === 'percent' && (
            <>
              {members.map((m) => {
                const owed = getOwed(m.user_id)
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <Avatar
                      name={m.profile.display_name}
                      colorIndex={m.profile.color}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">
                      {m.profile.display_name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {amountMinor > 0 && owed > 0 && (
                        <span className="text-xs text-ink-secondary money">
                          ₹{formatMinorToDecimal(owed)}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={percentages[m.user_id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '' || /^\d*\.?\d{0,2}$/.test(v))
                              setPercentages((prev) => ({ ...prev, [m.user_id]: v }))
                          }}
                          className="w-16 bg-bg border border-border rounded-md px-2 py-1.5 text-sm
                                     text-ink text-right
                                     focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                        />
                        <span className="text-xs text-ink-secondary">%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <p
                className={`text-xs font-medium text-right ${
                  Math.abs(percentRemaining) < 0.01 ? 'text-positive' : 'text-negative'
                }`}
              >
                {Math.abs(percentRemaining) < 0.01
                  ? '✓ 100%'
                  : percentRemaining > 0
                    ? `${percentRemaining.toFixed(1)}% remaining`
                    : `${Math.abs(percentRemaining).toFixed(1)}% over`}
              </p>
            </>
          )}

          {/* SHARES */}
          {splitMethod === 'shares' &&
            members.map((m) => {
              const w = weights[m.user_id] ?? 1
              const owed = getOwed(m.user_id)
              return (
                <div key={m.user_id} className="flex items-center gap-3">
                  <Avatar
                    name={m.profile.display_name}
                    colorIndex={m.profile.color}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">
                    {m.profile.display_name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {amountMinor > 0 && owed > 0 && (
                      <span className="text-xs text-ink-secondary money">
                        ₹{formatMinorToDecimal(owed)}
                      </span>
                    )}
                    <div className="flex items-center">
                      <button
                        onClick={() =>
                          setWeights((prev) => ({
                            ...prev,
                            [m.user_id]: Math.max(0, (prev[m.user_id] ?? 1) - 1),
                          }))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-ink/5
                                   text-ink-secondary hover:bg-ink/10 active:scale-90 transition-all
                                   text-sm font-bold"
                        aria-label={`Decrease weight for ${m.profile.display_name}`}
                      >
                        &minus;
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-ink money">
                        {w}
                      </span>
                      <button
                        onClick={() =>
                          setWeights((prev) => ({
                            ...prev,
                            [m.user_id]: (prev[m.user_id] ?? 1) + 1,
                          }))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-ink/5
                                   text-ink-secondary hover:bg-ink/10 active:scale-90 transition-all
                                   text-sm font-bold"
                        aria-label={`Increase weight for ${m.profile.display_name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

          {/* ADJUST */}
          {splitMethod === 'adjust' && (
            <>
              {members.map((m) => {
                const owed = getOwed(m.user_id)
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <Avatar
                      name={m.profile.display_name}
                      colorIndex={m.profile.color}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">
                      {m.profile.display_name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {amountMinor > 0 && owed > 0 && (
                        <span className="text-xs text-ink-secondary money">
                          ₹{formatMinorToDecimal(owed)}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-ink-secondary">±₹</span>
                        <input
                          type="text"
                          inputMode="text"
                          placeholder="0"
                          value={adjustments[m.user_id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '' || v === '-' || /^-?\d*\.?\d{0,2}$/.test(v))
                              setAdjustments((prev) => ({ ...prev, [m.user_id]: v }))
                          }}
                          className="w-20 bg-bg border border-border rounded-md px-2 py-1.5 text-sm
                                     text-ink text-right
                                     focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {splitError && (
                <p className="text-xs font-medium text-negative text-right">{splitError}</p>
              )}
            </>
          )}
        </div>

        {/* Split bar preview */}
        {splitBarSegments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <SplitBar segments={splitBarSegments} height={8} />
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="bg-surface border border-border rounded-card p-4">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 text-sm font-medium text-ink-secondary
                     hover:text-ink transition-colors w-full text-left"
        >
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${showNotes ? 'rotate-90' : ''}`}
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
          Add notes
        </button>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details..."
            rows={3}
            className="mt-3 w-full bg-bg border border-border rounded-md px-3 py-2.5
                       text-ink text-sm placeholder:text-ink-secondary/50 resize-none
                       focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        )}
      </section>

      {/* Save */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={() => handleSave(false)}
          disabled={!canSave || createExpense.isPending}
          className="w-full h-12 bg-primary text-on-primary rounded-pill text-[15px] font-semibold
                     hover:bg-primary-hover active:scale-[0.97] transition-all
                     disabled:opacity-40 disabled:pointer-events-none
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primary"
        >
          {createExpense.isPending ? 'Saving…' : 'Save expense'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={!canSave || createExpense.isPending}
          className="w-full py-2 text-sm font-medium text-primary hover:text-primary-hover
                     transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Save &amp; add another
        </button>
      </div>
    </div>
  )
}
