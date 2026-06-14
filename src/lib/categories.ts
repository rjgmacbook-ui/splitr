export const CATEGORIES = [
  { value: 'food', label: 'Food & drink', icon: '🍽️' },
  { value: 'groceries', label: 'Groceries', icon: '🛒' },
  { value: 'transport', label: 'Transport', icon: '🚕' },
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'general', label: 'General', icon: '📦' },
] as const

export function getCategoryIcon(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.icon ?? '📦'
}

export const GROUP_TYPE_ICONS: Record<string, string> = {
  trip: '✈️',
  home: '🏠',
  couple: '❤️',
  other: '👥',
}
