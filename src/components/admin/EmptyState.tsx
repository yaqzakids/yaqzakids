interface EmptyStateProps {
  message: string
  action?: React.ReactNode
}

export default function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
      <p style={{ margin: '0 0 16px', fontSize: 15 }}>{message}</p>
      {action}
    </div>
  )
}
