interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-center py-12 px-4">
      <p className="text-coral font-semibold mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-gold text-white rounded-full font-bold hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
