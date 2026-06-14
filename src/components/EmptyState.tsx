interface EmptyStateProps {
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-ink-secondary text-sm">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-pill text-sm font-medium
                     hover:bg-primary-hover active:scale-[0.97] transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
