import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import { LEARNING_PATHS_HOME } from '@/lib/discoverer'

export default function PathsPage() {
  return (
    <DiscovererPageShell navMode="public">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <p className="text-teal text-xs font-extrabold tracking-widest uppercase mb-2">Discoverers · Ages 9–12</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-navy mb-3">Learning Paths</h1>
        <p className="text-muted max-w-2xl mb-10 leading-relaxed">
          Long-term journeys through science, history, faith, technology, and more. Each path builds
          curiosity, character, and Islamic reflection — one story at a time.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEARNING_PATHS_HOME.map((p) => (
            <div key={p.name} className={`bg-white rounded-2xl shadow-sm border-t-4 ${p.border} overflow-hidden`}>
              <div className={`h-24 bg-gradient-to-br ${p.gradient} flex items-center justify-center text-4xl`}>
                {p.emoji}
              </div>
              <div className="p-6">
                <h2 className="font-bold text-navy mb-2">{p.name}</h2>
                <p className="text-sm text-muted mb-4 leading-relaxed">{p.mission}</p>
                <p className="text-xs text-muted mb-4">{p.articles} guided lessons · Ages 9–12</p>
                <Link
                  to="/signup"
                  className="inline-block px-5 py-2 bg-teal text-white rounded-full text-sm font-extrabold hover:opacity-90"
                >
                  Start Free
                </Link>
              </div>
            </div>
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
