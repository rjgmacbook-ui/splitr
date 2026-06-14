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

interface AvatarProps {
  name: string
  colorIndex: number
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
} as const

export function Avatar({ name, colorIndex, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const color = PERSON_COLORS[colorIndex % 8]

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none`}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
