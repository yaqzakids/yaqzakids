import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import AvatarSelectorModal from '@/components/avatar/AvatarSelectorModal'
import UserAvatar from '@/components/UserAvatar'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import {
  AGE_GROUP_META,
  ageGroupFromAge,
  CHILD_INTEREST_OPTIONS,
  dashboardPathForAgeGroup,
  defaultAgeForGroup,
} from '@/lib/childProfiles'
import { createChildProfile, getChildProfiles, updateChildProfile } from '@/lib/supabase'
import { setPendingAgeGroupChild } from '@/lib/onboarding'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import { isPresetAvatarId, type PresetAvatarId } from '@/lib/avatar/presetAvatars'
import type { AgeGroup, Language } from '@/lib/types'

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
]

export default function ChildProfileFormPage() {
  const { childProfileId } = useParams<{ childProfileId?: string }>()
  const [searchParams] = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === '1'
  const isEdit = Boolean(childProfileId)
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const {
    selectedChild,
    refreshChildren,
    enterChildExperience,
    loading: childLoading,
  } = useSelectedChild()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const [name, setName] = useState('')
  const [age, setAge] = useState(10)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('discoverer')
  const [ageGroupManual, setAgeGroupManual] = useState(false)
  const [avatarId, setAvatarId] = useState<PresetAvatarId | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [interests, setInterests] = useState<string[]>([])
  const [previousAgeGroup, setPreviousAgeGroup] = useState<AgeGroup | null>(null)

  useEffect(() => {
    if (!isEdit || !user || authLoading || childLoading) return

    let cancelled = false
    setLoading(true)
    getChildProfiles(user.id)
      .then((kids) => {
        if (cancelled) return
        const child = kids.find((k) => k.id === childProfileId)
        if (!child) {
          setError('Child profile not found.')
          return
        }
        setName(child.name)
        const childAge = child.age ?? defaultAgeForGroup(child.age_group)
        setAge(childAge)
        setAgeGroup(child.age_group)
        setPreviousAgeGroup(child.age_group)
        setAvatarId(isPresetAvatarId(child.avatar_id) ? child.avatar_id : null)
        setLanguage(child.language)
        setInterests(child.interests ?? [])
      })
      .catch((err) => setError(formatSupabaseError(err)))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isEdit, childProfileId, user, authLoading, childLoading])

  const handleAgeChange = (nextAge: number) => {
    setAge(nextAge)
    if (!ageGroupManual) {
      setAgeGroup(ageGroupFromAge(nextAge))
    }
  }

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (age < 6 || age > 16) {
      setError('Age must be between 6 and 16.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (isEdit && childProfileId) {
        await updateChildProfile(childProfileId, {
          name,
          age,
          age_group: ageGroup,
          avatar_id: avatarId,
          language,
          interests,
        })
      } else {
        const created = await createChildProfile({
          parent_id: user.id,
          name,
          age,
          age_group: ageGroup,
          avatar: null,
          avatar_id: avatarId,
          language,
          interests,
        })
        await refreshChildren()

        if (isOnboarding) {
          setPendingAgeGroupChild(created.id)
          navigate(`/onboarding/choose-path?childId=${created.id}`, { replace: true })
          return
        }
      }

      await refreshChildren()

      const activeId = isEdit ? childProfileId : null
      const wasActive = activeId && selectedChild?.id === activeId
      const ageGroupChanged = isEdit && previousAgeGroup && previousAgeGroup !== ageGroup

      if (wasActive && ageGroupChanged) {
        enterChildExperience(activeId!)
        navigate(dashboardPathForAgeGroup(ageGroup), { replace: true })
        return
      }

      navigate('/children')
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || (isEdit && loading)) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center px-6">
        <Link to="/login" className="text-[#2AAFA0] font-extrabold hover:underline">
          Sign in to manage child profiles →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EEF4FF] page-transition">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <Link to="/children" className="text-sm font-bold text-[#6B7280] hover:text-[#1B2F5E]">
            ← Back to profiles
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] mt-3">
            {isEdit ? 'Edit child profile' : isOnboarding ? 'Create child profile' : 'Add a child'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#1B2F5E] mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Child's name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#1B2F5E] mb-2">Age</label>
              <input
                type="number"
                min={6}
                max={16}
                value={age}
                onChange={(e) => handleAgeChange(Number(e.target.value))}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none"
              />
            </div>
            {!isOnboarding && (
              <div>
                <label className="block text-sm font-bold text-[#1B2F5E] mb-2">Age group</label>
                <select
                  value={ageGroup}
                  onChange={(e) => {
                    setAgeGroupManual(true)
                    setAgeGroup(e.target.value as AgeGroup)
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none bg-white"
                >
                  {(Object.keys(AGE_GROUP_META) as AgeGroup[]).map((group) => (
                    <option key={group} value={group}>
                      {AGE_GROUP_META[group].emoji} {AGE_GROUP_META[group].label} (Ages {AGE_GROUP_META[group].ages})
                    </option>
                  ))}
                </select>
                {!ageGroupManual && (
                  <p className="text-xs text-[#6B7280] mt-1">Auto-selected from age</p>
                )}
              </div>
            )}
          </div>
          {isOnboarding && (
            <p className="text-sm text-[#6B7280] leading-relaxed">
              You&apos;ll choose Explorer, Discoverer, or Thinker on the next step.
            </p>
          )}

          <div>
            <label className="block text-sm font-bold text-[#1B2F5E] mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none bg-white"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-bold text-[#1B2F5E] mb-3">Avatar</p>
            <div className="flex items-center gap-4">
              <UserAvatar name={name || 'Child'} avatarId={avatarId} size={64} />
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                className="px-4 py-2 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-bold hover:bg-[#1B2F5E]/5"
              >
                Choose avatar
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-[#1B2F5E] mb-3">Interests</p>
            <div className="flex flex-wrap gap-2">
              {CHILD_INTEREST_OPTIONS.map((interest) => {
                const selected = interests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-colors ${
                      selected
                        ? 'bg-[#2AAFA0] border-[#2AAFA0] text-white'
                        : 'border-gray-200 text-[#1B2F5E] hover:border-[#2AAFA0]/40'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/children')}
              className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-[#6B7280]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save profile' : 'Add child'}
            </button>
          </div>
        </form>
      </main>

      <AvatarSelectorModal
        open={avatarOpen}
        selectedId={avatarId}
        onClose={() => setAvatarOpen(false)}
        onSave={(id) => {
          setAvatarId(id)
          setAvatarOpen(false)
        }}
        variant="default"
      />
    </div>
  )
}
