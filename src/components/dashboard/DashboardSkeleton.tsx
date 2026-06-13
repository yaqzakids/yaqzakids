export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="mt-5 h-3 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  )
}
