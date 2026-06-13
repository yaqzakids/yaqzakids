import { useEffect, useState } from 'react'
import PresetAvatarIllustration from '@/components/avatar/PresetAvatarIllustration'
import { adminBtn } from '@/lib/admin/styles'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'
import { PRESET_AVATARS, type PresetAvatarId } from '@/lib/avatar/presetAvatars'

interface AvatarSelectorModalProps {
  open: boolean
  selectedId: PresetAvatarId | null
  onClose: () => void
  onSave: (avatarId: PresetAvatarId) => void | Promise<void>
  saving?: boolean
  error?: string | null
  variant?: 'admin' | 'default'
}

export default function AvatarSelectorModal({
  open,
  selectedId,
  onClose,
  onSave,
  saving = false,
  error = null,
  variant = 'admin',
}: AvatarSelectorModalProps) {
  const [draftId, setDraftId] = useState<PresetAvatarId | null>(selectedId)

  useEffect(() => {
    if (open) {
      setDraftId(selectedId ?? PRESET_AVATARS[0].id)
    }
  }, [open, selectedId])

  if (!open) return null

  const isAdmin = variant === 'admin'
  const gold = isAdmin ? dashboardTheme.gold : '#D4A017'

  const handleSave = () => {
    if (draftId) {
      void onSave(draftId)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-selector-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
        style={{ background: isAdmin ? dashboardTheme.white : '#fff' }}
      >
        <div
          className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between"
          style={{ background: isAdmin ? dashboardTheme.white : '#fff', borderColor: isAdmin ? dashboardTheme.border : '#E5E7EB' }}
        >
          <h2
            id="avatar-selector-title"
            className={isAdmin ? '' : 'font-display'}
            style={{
              margin: 0,
              fontSize: 20,
              fontFamily: isAdmin ? 'Playfair Display, serif' : undefined,
              color: isAdmin ? dashboardTheme.navy : '#1A2744',
            }}
          >
            Choose Your Avatar
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border-0 bg-gray-100 cursor-pointer text-lg leading-none hover:bg-gray-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {PRESET_AVATARS.map((avatar) => {
              const selected = draftId === avatar.id
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setDraftId(avatar.id)}
                  className="flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer border-2 bg-white hover:scale-[1.02]"
                  style={{
                    borderColor: selected ? gold : '#E5E7EB',
                    boxShadow: selected ? `0 0 0 2px ${gold}33` : undefined,
                  }}
                  aria-pressed={selected}
                  aria-label={avatar.name}
                >
                  <PresetAvatarIllustration id={avatar.id} size={72} />
                </button>
              )
            })}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <div
            className="flex flex-wrap gap-3 pt-5 mt-5 border-t"
            style={{ borderColor: isAdmin ? dashboardTheme.border : '#E5E7EB' }}
          >
            {isAdmin ? (
              <>
                <button type="button" style={adminBtn.secondary} disabled={saving} onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  style={{ ...adminBtn.primary, opacity: saving ? 0.7 : 1 }}
                  disabled={saving || !draftId}
                  onClick={handleSave}
                >
                  {saving ? 'Saving…' : 'Save Avatar'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !draftId}
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gold text-white rounded-full font-extrabold disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Avatar'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
