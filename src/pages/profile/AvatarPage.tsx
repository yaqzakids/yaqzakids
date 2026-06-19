import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import PresetAvatarIllustration from '@/components/avatar/PresetAvatarIllustration'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { childNavPaths } from '@/lib/navLinks'
import {
  DEFAULT_PRESET_AVATAR_ID,
  isPresetAvatarId,
  PRESET_AVATARS,
  type PresetAvatarId,
} from '@/lib/avatar/presetAvatars'
import { updateChildProfile } from '@/lib/supabase'

export default function AvatarPage() {
  const { selectedChild, loading: childLoading, refreshChildren } = useSelectedChild()
  const [selectedId, setSelectedId] = useState<PresetAvatarId>(DEFAULT_PRESET_AVATAR_ID)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const profilePath = selectedChild ? childNavPaths(selectedChild).profile : '/discoverer/profile'

  useEffect(() => {
    if (!selectedChild) return
    if (isPresetAvatarId(selectedChild.avatar_id)) {
      setSelectedId(selectedChild.avatar_id)
      return
    }
    setSelectedId(DEFAULT_PRESET_AVATAR_ID)
  }, [selectedChild?.id, selectedChild?.avatar_id])

  const handleSave = async () => {
    if (!selectedChild) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateChildProfile(selectedChild.id, { avatar_id: selectedId })
      await refreshChildren()
      setMessage('Avatar saved!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save avatar.')
    } finally {
      setSaving(false)
    }
  }

  if (childLoading) {
    return (
      <DiscovererPageShell backFallback={profilePath} homeTo={profilePath}>
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  if (!selectedChild) {
    return (
      <DiscovererPageShell backFallback="/children" homeTo="/children">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <p className="text-[#1B2F5E] font-bold mb-4">Choose a child profile first.</p>
          <Link to="/children" className="text-[#2AAFA0] font-extrabold hover:underline">
            Go to child selector →
          </Link>
        </div>
      </DiscovererPageShell>
    )
  }

  return (
    <DiscovererPageShell backFallback={profilePath} homeTo={profilePath} backLabel="← Back to profile">
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] mb-8">Choose Avatar</h1>

        <div className="bg-white rounded-2xl border border-[#E2EBF8] shadow-sm p-6 md:p-8 mb-6">
          <div className="flex justify-center pb-6 mb-6 border-b border-[#E2EBF8]">
            <PresetAvatarIllustration id={selectedId} size={112} />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
            {PRESET_AVATARS.map((avatar) => {
              const selected = selectedId === avatar.id
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedId(avatar.id)}
                  className="flex items-center justify-center p-1.5 rounded-full transition-all cursor-pointer border-2 bg-white hover:scale-[1.05]"
                  style={{
                    borderColor: selected ? '#F5A623' : '#E5E7EB',
                    boxShadow: selected ? '0 0 0 2px rgba(245, 166, 35, 0.25)' : undefined,
                  }}
                  aria-pressed={selected}
                  aria-label={avatar.name}
                >
                  <PresetAvatarIllustration id={avatar.id} size={72} />
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-sm text-[#E85D4A] font-semibold mb-4">{error}</p>}
        {message && <p className="text-sm text-[#2AAFA0] font-semibold mb-4">{message}</p>}

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="px-8 py-3 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Avatar'}
        </button>
      </div>
    </DiscovererPageShell>
  )
}
