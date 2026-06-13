function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] ${className}`}
    />
  )
}

export function SupportFormSkeleton() {
  return (
    <div className="space-y-4">
      <Shimmer className="h-10 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Shimmer className="h-10 w-full" />
        <Shimmer className="h-10 w-full" />
      </div>
      <Shimmer className="h-32 w-full" />
      <Shimmer className="h-11 w-40 rounded-full" />
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  )
}

export function SupportTicketListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 p-4 space-y-2">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-5 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
        </div>
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  )
}

export function SupportThreadSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
          <Shimmer className="h-20 w-2/3 max-w-md rounded-2xl" />
        </div>
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  )
}
