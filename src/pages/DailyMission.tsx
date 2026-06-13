import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchDailyMission, saveReflectionResponse } from '@/lib/discoverer'

export default function DailyMission() {
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [mission, setMission] = useState<Awaited<ReturnType<typeof fetchDailyMission>> | null>(null)
  const [reflection, setReflection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    if (!selectedChild) return
    setLoading(true)
    try {
      setMission(await fetchDailyMission(selectedChild.id))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!childLoading) load()
  }, [selectedChild?.id, childLoading])

  const allDone =
    mission?.readStory && mission?.passQuiz && mission?.answerReflection

  const handleSubmitReflection = async () => {
    if (!selectedChild || !mission?.featuredArticle || !reflection.trim()) return
    setSubmitting(true)
    setMessage(null)
    try {
      await saveReflectionResponse(selectedChild.id, mission.featuredArticle.id, reflection)
      setMessage('Reflection saved! 🌟')
      await load()
    } catch {
      setMessage('Could not save reflection. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (childLoading || loading) {
    return (
      <DiscovererPageShell>
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  if (!selectedChild) {
    return (
      <DiscovererPageShell>
        <div className="max-w-lg mx-auto py-24 px-6 text-center">
          <p className="text-navy font-bold mb-4">Sign in and select a child to start today&apos;s mission.</p>
          <Link to="/login" className="text-teal font-extrabold">Sign in →</Link>
        </div>
      </DiscovererPageShell>
    )
  }

  return (
    <DiscovererPageShell>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-navy mb-1">Today&apos;s Mission 🎯</h1>
        <p className="text-muted mb-8">{today}</p>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-navy text-lg mb-1">📖 Read a Story</p>
                <p className="text-sm text-muted mb-3">
                  {mission?.featuredArticle?.title ?? 'Pick a story from Explore'}
                </p>
                {!mission?.readStory && (
                  <Link
                    to="/discoverer/explore"
                    className="inline-block px-5 py-2 bg-teal text-white rounded-full text-sm font-extrabold"
                  >
                    Read Now →
                  </Link>
                )}
              </div>
              {mission?.readStory && <span className="text-2xl">✅</span>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-navy text-lg mb-3">❓ Pass a Quiz</p>
                {!mission?.passQuiz && (
                  <Link
                    to="/discoverer/explore"
                    className="inline-block px-5 py-2 bg-teal text-white rounded-full text-sm font-extrabold"
                  >
                    Take Quiz →
                  </Link>
                )}
              </div>
              {mission?.passQuiz && <span className="text-2xl">✅</span>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="font-bold text-navy text-lg">💭 Answer a Reflection</p>
              {mission?.answerReflection && <span className="text-2xl">✅</span>}
            </div>
            {!mission?.answerReflection && (
              <>
                <p className="text-sm text-navy mb-3 italic">
                  {mission?.reflectionQuestion ??
                    'What is one thing you learned today that made you think about Allah?'}
                </p>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-teal focus:outline-none mb-3"
                  placeholder="Write your thoughts…"
                />
                <button
                  type="button"
                  disabled={submitting || !reflection.trim()}
                  onClick={handleSubmitReflection}
                  className="px-5 py-2 bg-teal text-white rounded-full text-sm font-extrabold disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Submit →'}
                </button>
              </>
            )}
          </div>
        </div>

        {message && <p className="text-teal font-bold text-center mt-4">{message}</p>}

        <div
          className={`mt-10 rounded-2xl p-8 text-center transition-all ${
            allDone ? 'bg-[#FFF8ED] border-2 border-[#F5A623]' : 'bg-white border border-gray-100 shadow-sm'
          }`}
        >
          <p className="font-bold text-navy text-lg mb-2">
            {allDone ? '🎉 Mission Complete!' : 'Complete all 3 to earn +10 ⭐ bonus stars!'}
          </p>
          {allDone && <p className="text-3xl animate-pulse">⭐⭐⭐</p>}
        </div>
      </div>
    </DiscovererPageShell>
  )
}
