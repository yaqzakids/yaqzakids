import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import { LEARNING_PATHS } from '@/lib/learningPaths'

export default function PathsPage() {
  return (
    <DiscovererPageShell navMode="public">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <p className="text-teal text-xs font-extrabold tracking-widest uppercase mb-2">Learning Journeys</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-navy mb-3">Learning Paths</h1>
        <p className="text-muted max-w-2xl mb-10 leading-relaxed">
          Long-term journeys through science, history, faith, technology, and more. Each path builds
          curiosity, character, and Islamic reflection — one story at a time.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEARNING_PATHS.map((p) => (
            <Link
              key={p.slug}
              to={`/paths/${p.slug}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden no-underline hover:shadow-md transition-shadow"
              style={{ borderTopWidth: 4, borderTopColor: p.color }}
            >
              <div
                className="h-24 flex items-center justify-center text-4xl"
                style={{ background: `linear-gradient(135deg, ${p.color}15, ${p.color}30)` }}
              >
                {p.icon}
              </div>
              <div className="p-6">
                <h2 className="font-bold text-navy mb-2">{p.name}</h2>
                <p className="text-sm text-muted mb-4 leading-relaxed">{p.mission}</p>
                <span className="text-teal text-sm font-extrabold">Explore path →</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/sample-stories"
            className="inline-flex items-center gap-2 text-teal font-extrabold hover:underline"
          >
            Try sample stories first →
          </Link>
        </div>
      </div>
    </DiscovererPageShell>
  )
}
