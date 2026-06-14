import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { z } from 'zod/v4'
import { useAuth } from '@/hooks/useAuth'

const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = signInSchema.extend({
  displayName: z.string().min(1, 'Name is required'),
})

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function DecoBar() {
  const colors = [
    'var(--color-person-0)', 'var(--color-person-1)', 'var(--color-person-4)',
    'var(--color-person-2)', 'var(--color-person-5)', 'var(--color-person-3)',
  ]
  return (
    <div className="flex gap-[3px] w-full max-w-[180px] h-[5px] mx-auto">
      {colors.map((bg, i) => (
        <div
          key={i}
          className="flex-1 rounded-full opacity-70"
          style={{
            backgroundColor: bg,
            animation: `decoGrow 500ms cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms both`,
          }}
        />
      ))}
    </div>
  )
}

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const schema = mode === 'signin' ? signInSchema : signUpSchema
    const payload = mode === 'signin' ? { email, password } : { email, password, displayName }
    const result = schema.safeParse(payload)

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, displayName)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    try {
      await signInWithGoogle(`${window.location.origin}${from}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-5 py-10">
      {/* Keyframe for the decorative bar */}
      <style>{`
        @keyframes decoGrow {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 0.7; }
        }
      `}</style>

      <div className="w-full max-w-[400px]">
        {/* ── Brand header ── */}
        <div className="text-center mb-8">
          <h1 className="font-display text-[38px] font-semibold text-ink leading-tight tracking-tight">
            Splitr
          </h1>
          <p className="text-ink-secondary text-[15px] mt-2 leading-snug">
            Split expenses with friends and family — free, forever.
          </p>
          <div className="mt-5">
            <DecoBar />
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-surface border border-border rounded-sheet p-6">
          {/* ── Mode toggle ── */}
          <div className="flex bg-bg rounded-pill p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 h-10 rounded-pill text-sm font-semibold transition-all
                ${mode === 'signin'
                  ? 'bg-primary text-on-primary shadow-[0_1px_4px_rgba(108,92,231,0.25)]'
                  : 'text-ink-secondary hover:text-ink'
                }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 h-10 rounded-pill text-sm font-semibold transition-all
                ${mode === 'signup'
                  ? 'bg-primary text-on-primary shadow-[0_1px_4px_rgba(108,92,231,0.25)]'
                  : 'text-ink-secondary hover:text-ink'
                }`}
            >
              Sign up
            </button>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className="h-12 px-4 rounded-md border border-border bg-surface text-ink
                           placeholder:text-ink-secondary text-[15px]
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                           transition-shadow"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-12 px-4 rounded-md border border-border bg-surface text-ink
                         placeholder:text-ink-secondary text-[15px]
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                         transition-shadow"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="h-12 px-4 rounded-md border border-border bg-surface text-ink
                         placeholder:text-ink-secondary text-[15px]
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                         transition-shadow"
            />

            {error && (
              <p className="text-negative text-sm px-1" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 bg-primary text-on-primary rounded-pill text-[15px] font-semibold
                         hover:bg-primary-hover active:scale-[0.97] transition-all
                         disabled:opacity-60 disabled:pointer-events-none mt-1"
            >
              {submitting
                ? mode === 'signin' ? 'Signing in…' : 'Creating account…'
                : mode === 'signin' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-ink-secondary text-xs font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Google ── */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-12 rounded-pill border border-border bg-surface
                       flex items-center justify-center gap-2.5
                       text-ink text-[15px] font-medium
                       hover:bg-bg active:scale-[0.97] transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
