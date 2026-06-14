import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GROUP_TYPE_ICONS } from '@/lib/categories'
import { useCreateGroup } from '@/hooks/useGroups'

const GROUP_TYPES = [
  { value: 'trip', label: 'Trip', icon: '✈️' },
  { value: 'home', label: 'Home', icon: '🏠' },
  { value: 'couple', label: 'Couple', icon: '❤️' },
  { value: 'other', label: 'Other', icon: '👥' },
] as const

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 15L7.5 10l5-5" />
    </svg>
  )
}

export function CreateGroupPage() {
  const navigate = useNavigate()
  const createGroup = useCreateGroup()
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('other')
  const [icon, setIcon] = useState('')
  const [error, setError] = useState('')

  const selectedIcon = icon || GROUP_TYPE_ICONS[type] || '👥'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        type,
        icon: icon || null,
      })
      navigate(`/groups/${group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    }
  }

  return (
    <div className="pb-8">
      <header className="px-4 pt-5 pb-3 flex items-center gap-2">
        <Link
          to="/"
          className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full
                     text-ink-secondary hover:text-ink hover:bg-ink/[0.05] transition-colors"
          aria-label="Back"
        >
          <BackIcon />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink">Create group</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-5">
        {/* Icon preview */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-card bg-surface border border-border
                          flex items-center justify-center text-4xl">
            {selectedIcon}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1 mb-2 block">
            Group name
          </label>
          <input
            type="text"
            placeholder="e.g. Goa Trip, Flat 12B"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full h-12 px-4 rounded-md border border-border bg-surface text-ink text-[15px]
                       placeholder:text-ink-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       transition-shadow"
            maxLength={50}
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1 mb-2 block">
            Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {GROUP_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setType(t.value); if (!icon) setIcon('') }}
                className={`h-16 rounded-card border flex flex-col items-center justify-center gap-1
                           transition-all active:scale-95
                           ${type === t.value
                             ? 'border-primary bg-primary/[0.08] text-ink'
                             : 'border-border bg-surface text-ink-secondary hover:border-primary/30'
                           }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom emoji */}
        <div>
          <label className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1 mb-2 block">
            Custom icon (optional)
          </label>
          <input
            type="text"
            placeholder="Paste an emoji"
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, 2))}
            className="w-full h-12 px-4 rounded-md border border-border bg-surface text-ink text-[15px]
                       placeholder:text-ink-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       transition-shadow"
          />
        </div>

        {error && (
          <p className="text-negative text-sm px-1">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim() || createGroup.isPending}
          className="h-12 bg-primary text-on-primary rounded-pill text-[15px] font-semibold
                     hover:bg-primary-hover active:scale-[0.97] transition-all
                     disabled:opacity-40 disabled:pointer-events-none mt-2"
        >
          {createGroup.isPending ? 'Creating…' : 'Create group'}
        </button>
      </form>
    </div>
  )
}
