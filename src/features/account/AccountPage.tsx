import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useTheme } from '@/hooks/useTheme'

const PERSON_COLORS = [
  'var(--color-person-0)', 'var(--color-person-1)', 'var(--color-person-2)', 'var(--color-person-3)',
  'var(--color-person-4)', 'var(--color-person-5)', 'var(--color-person-6)', 'var(--color-person-7)',
] as const

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5l2.5 2.5L11 4" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 15.5H3.5a1 1 0 01-1-1v-11a1 1 0 011-1h3" />
      <path d="M12 12.5l3.5-3.5L12 5.5" />
      <path d="M15.5 9H7" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wider px-1 mb-2">
      {children}
    </p>
  )
}

export function AccountPage() {
  const { user, signOut } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const email = user?.email ?? ''

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [upiValue, setUpiValue] = useState('')
  const [localColor, setLocalColor] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setNameValue(profile.display_name)
      setUpiValue(profile.upi_id ?? '')
      setLocalColor(profile.color)
    }
  }, [profile])

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function startEditName() {
    setNameValue(profile!.display_name)
    setEditingName(true)
  }

  function saveName() {
    const trimmed = nameValue.trim()
    if (user && trimmed && trimmed !== profile!.display_name) {
      updateProfile.mutate({ id: profile!.id, display_name: trimmed })
    }
    setEditingName(false)
  }

  function handleNameKey(e: KeyboardEvent) {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') {
      setNameValue(profile!.display_name)
      setEditingName(false)
    }
  }

  function saveColor(color: number) {
    setLocalColor(color)
    if (user && color !== profile!.color) {
      updateProfile.mutate({ id: profile!.id, color })
    }
  }

  function saveUpi() {
    const trimmed = upiValue.trim()
    const current = profile!.upi_id ?? ''
    if (user && trimmed !== current) {
      updateProfile.mutate({ id: profile!.id, upi_id: trimmed || null })
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-8 flex flex-col gap-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar name={profile.display_name} colorIndex={localColor} size="lg" />
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={handleNameKey}
              className="font-display text-xl font-semibold text-ink bg-transparent
                         border-b-2 border-primary outline-none w-full pb-0.5"
              maxLength={50}
            />
          ) : (
            <button
              onClick={startEditName}
              className="flex items-center gap-2 group"
            >
              <h1 className="font-display text-xl font-semibold text-ink truncate">
                {profile.display_name}
              </h1>
              <span className="text-ink-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                <PencilIcon />
              </span>
            </button>
          )}
          <p className="text-ink-secondary text-sm mt-0.5 truncate">{email}</p>
        </div>
      </div>

      {/* Person color */}
      <div>
        <SectionLabel>Your colour</SectionLabel>
        <div className="bg-surface border border-border rounded-card p-4">
          <div className="flex gap-3 justify-center">
            {PERSON_COLORS.map((cssVar, i) => (
              <button
                key={i}
                onClick={() => saveColor(i)}
                className="w-9 h-9 rounded-full flex items-center justify-center
                           transition-transform active:scale-90
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{ backgroundColor: cssVar }}
                aria-label={`Color ${i + 1}${localColor === i ? ' (selected)' : ''}`}
              >
                {localColor === i && <CheckIcon />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* UPI ID */}
      <div>
        <SectionLabel>UPI ID</SectionLabel>
        <div className="bg-surface border border-border rounded-card p-4">
          <input
            type="text"
            placeholder="yourname@upi"
            value={upiValue}
            onChange={(e) => setUpiValue(e.target.value)}
            onBlur={saveUpi}
            className="w-full h-11 px-3 rounded-md border border-border bg-bg text-ink text-sm
                       placeholder:text-ink-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       transition-shadow"
          />
          <p className="text-ink-secondary text-xs mt-2 px-1">
            Friends can use this to send you money via UPI.
          </p>
        </div>
      </div>

      {/* Theme */}
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <div className="bg-surface border border-border rounded-card p-4">
          <div className="flex bg-bg rounded-pill p-1">
            {THEME_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 h-10 rounded-pill text-sm font-semibold transition-all
                  ${theme === value
                    ? 'bg-primary text-on-primary shadow-[0_1px_4px_rgba(108,92,231,0.2)]'
                    : 'text-ink-secondary hover:text-ink'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="pt-2">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full h-12 rounded-card border border-border bg-surface
                     flex items-center justify-center gap-2
                     text-ink text-sm font-medium
                     hover:border-negative hover:text-negative
                     active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:pointer-events-none"
        >
          <LogoutIcon />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
