import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchParentReport, usulThemeLabel } from '@/lib/discoverer'
import type { ParentDiscovererReport } from '@/lib/discoverer'
import LoadingSpinner from '@/components/LoadingSpinner'

interface DiscovererReportTabProps {
  childId: string
  childName: string
  parentUserId: string
}

export default function DiscovererReportTab({
  childId,
  childName,
  parentUserId,
}: DiscovererReportTabProps) {
  const [report, setReport] = useState<ParentDiscovererReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParentReport(parentUserId, childId, childName)
      .then(setReport)
      .finally(() => setLoading(false))
  }, [childId, childName, parentUserId])

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!report) {
    return <p className="text-muted text-center py-8">Could not load report.</p>
  }

  const themes = report.themesExplored.length
    ? report.themesExplored
    : (['stewardship', 'knowledge', 'tawhid'] as const)

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-display text-xl font-bold text-navy mb-4">
          This Week — {report.childName}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#EEF4FF] rounded-xl p-4">
            <p className="text-2xl font-extrabold text-teal">{report.articlesRead}</p>
            <p className="text-sm text-muted">Articles read</p>
          </div>
          <div className="bg-[#EEF4FF] rounded-xl p-4">
            <p className="text-2xl font-extrabold text-teal">{report.quizzesCompleted}</p>
            <p className="text-sm text-muted">Quizzes completed</p>
          </div>
          <div className="bg-[#EEF4FF] rounded-xl p-4">
            <p className="text-2xl font-extrabold text-teal">{report.reflectionsAnswered}</p>
            <p className="text-sm text-muted">Reflections answered</p>
          </div>
          <div className="bg-[#EEF4FF] rounded-xl p-4">
            <p className="text-2xl font-extrabold text-[#F5A623]">{report.starsEarned}</p>
            <p className="text-sm text-muted">Stars earned</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-display text-xl font-bold text-navy mb-4">Islamic Worldview Growth</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {themes.map((t) => (
            <div key={t} className="text-center bg-[#FFF8ED] rounded-xl p-4">
              <p className="text-2xl mb-1">✨</p>
              <p className="text-sm font-bold text-navy">{usulThemeLabel(t)}</p>
            </div>
          ))}
        </div>
        {themes.map((t) => (
          <div key={`bar-${t}`} className="mb-3">
            <div className="flex justify-between text-xs font-bold text-muted mb-1">
              <span>{usulThemeLabel(t)}</span>
              <span>Explored</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div className="h-full w-3/4 bg-teal rounded-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-display text-xl font-bold text-navy mb-3">Family Discussion</h3>
        <div className="bg-[#EEF4FF] rounded-xl p-5">
          <p className="text-navy leading-relaxed italic mb-4">{report.discussionPrompt}</p>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                void navigator.share({ text: report.discussionPrompt })
              }
            }}
            className="px-4 py-2 border-2 border-navy text-navy rounded-full text-sm font-bold"
          >
            Share prompt
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-display text-xl font-bold text-navy mb-4">Certificates Earned</h3>
        {report.certificates.length === 0 ? (
          <p className="text-muted text-sm">No certificates yet — complete a path to earn one!</p>
        ) : (
          <ul className="space-y-2">
            {report.certificates.map((c) => (
              <li key={c.id} className="flex justify-between items-center text-sm">
                <span className="font-bold text-navy">{c.path_name}</span>
                <span className="text-muted">
                  {new Date(c.completed_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/discoverer/certificates" className="inline-block mt-4 text-teal font-extrabold text-sm">
          View certificates →
        </Link>
      </section>
    </div>
  )
}

export function DiscovererReportSection() {
  const { user } = useAuth()
  const { selectedChild, children } = useSelectedChild()
  const discovererChildren = children.filter((c) => c.age_group === 'discoverer')
  const [activeChildId, setActiveChildId] = useState<string | null>(null)

  useEffect(() => {
    const pick =
      discovererChildren.find((c) => c.id === selectedChild?.id) ??
      discovererChildren[0] ??
      null
    setActiveChildId(pick?.id ?? null)
  }, [selectedChild?.id, discovererChildren.length])

  if (!user || discovererChildren.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold text-navy mb-4">Discoverer Report</h2>
        <p className="text-muted bg-white rounded-2xl border border-gray-200 p-6">
          Add a Discoverer (ages 9–12) child profile to see learning reports here.
        </p>
      </section>
    )
  }

  const activeChild = discovererChildren.find((c) => c.id === activeChildId) ?? discovererChildren[0]

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2 className="font-display text-2xl font-bold text-navy">Discoverer Report</h2>
        {discovererChildren.length > 1 && (
          <select
            value={activeChild.id}
            onChange={(e) => setActiveChildId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {discovererChildren.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>
      <DiscovererReportTab
        childId={activeChild.id}
        childName={activeChild.name}
        parentUserId={user.id}
      />
    </section>
  )
}
