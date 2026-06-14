import { useEffect, useState } from 'react'

const PERSON_COLORS = [
  'var(--color-person-0)',
  'var(--color-person-1)',
  'var(--color-person-2)',
  'var(--color-person-3)',
  'var(--color-person-4)',
  'var(--color-person-5)',
  'var(--color-person-6)',
  'var(--color-person-7)',
] as const

export interface SplitSegment {
  colorIndex: number
  amount: number
}

interface SplitBarProps {
  segments: SplitSegment[]
  animate?: boolean
  height?: number
}

export function SplitBar({ segments, animate = true, height = 6 }: SplitBarProps) {
  const [mounted, setMounted] = useState(!animate)
  const total = segments.reduce((sum, s) => sum + s.amount, 0)

  useEffect(() => {
    if (!animate) return
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [animate])

  if (total === 0) return null

  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className="flex w-full gap-[2px] overflow-hidden"
      style={{ height, borderRadius: height / 2 }}
      role="img"
      aria-label="Expense split proportions"
    >
      {segments.map((seg, i) => {
        const pct = (seg.amount / total) * 100
        return (
          <div
            key={`${seg.colorIndex}-${i}`}
            className="rounded-full"
            style={{
              backgroundColor: PERSON_COLORS[seg.colorIndex % 8],
              width: mounted ? `${pct}%` : '0%',
              transition: reducedMotion
                ? 'none'
                : `width 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 40}ms`,
              minWidth: mounted && pct > 0 ? 4 : 0,
            }}
          />
        )
      })}
    </div>
  )
}
