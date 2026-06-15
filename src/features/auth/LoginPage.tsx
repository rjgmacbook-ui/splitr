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
  const [signupDone, setSignupDone] = useState(false)

  const { signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const from = searchParams.get('redirect') ?? (location.state as { from?: string } | null)?.from ?? '/'

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSignupDone(false)
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
        navigate(from, { replace: true })
      } else {
        await signUpWithEmail(email, password, displayName)
        setSignupDone(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
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
          {signupDone ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-semibold text-ink mb-2">
                Check your email
              </h2>
              <p className="text-ink-secondary text-[15px] leading-relaxed mb-1">
                We sent a confirmation link to
              </p>
              <p className="text-ink font-medium text-[15px] mb-6">
                {email}
              </p>
              <p className="text-ink-secondary text-sm leading-relaxed mb-6">
                Click the link in the email to activate your account, then come back here to sign in.
              </p>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="h-12 w-full bg-primary text-on-primary rounded-pill text-[15px] font-semibold
                           hover:bg-primary-hover active:scale-[0.97] transition-all"
              >
                Go to sign in
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
