import { useEffect, useState } from 'react'
import { fetchPlatformSettings, updatePlatformSettings, type PlatformSetting } from '@/lib/admin/settings'
import AdminVoiceSettings, { isVoiceSettingKey } from '@/components/admin/AdminVoiceSettings'
import AdminUsersTeamPanel from '@/components/admin/AdminUsersTeamPanel'
import { adminBtn, adminCard, adminInput } from '@/lib/admin/styles'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'

const labels: Record<string, string> = {
  free_articles_per_pillar: 'Free Articles Per Pillar',
  max_children_free: 'Max Children (Free Plan)',
  max_children_paid: 'Max Children (Paid Plan)',
  quiz_pass_threshold: 'Quiz Pass Threshold (%)',
  stars_per_article: 'Stars Per Article',
  stars_per_quiz: 'Stars Per Quiz',
  stars_per_path: 'Stars Per Path',
  contact_email: 'Contact Email',
  admin_email: 'Admin Email',
  maintenance_mode: 'Maintenance Mode (true/false)',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchPlatformSettings()
      .then((s) => {
        setSettings(s)
        setValues(Object.fromEntries(s.map((x) => [x.key, x.value])))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const voiceKeys = [
        'voice_enabled',
        'voice_provider',
        'voice_default_en',
        'voice_default_fr',
        'voice_default_ar',
        'voice_speaking_speed',
        'voice_pronunciation_dictionary',
      ]
      const allKeys = [...new Set([...settings.map((s) => s.key), ...voiceKeys])]
      await updatePlatformSettings(
        allKeys.map((key) => ({ key, value: values[key] ?? '' }))
      )
      setMessage('Settings saved.')
    } catch {
      setMessage('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <CardSkeleton count={3} />

  const generalSettings = settings.filter((s) => !isVoiceSettingKey(s.key))

  return (
    <div>
      <AdminUsersTeamPanel />
      <AdminVoiceSettings values={values} setValues={setValues} />

      <div style={adminCard}>
        <h2 style={{ margin: '0 0 16px', fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
          Platform Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {generalSettings.map((s) => (
            <div key={s.key}>
              <label className="block text-sm font-semibold mb-1">{labels[s.key] ?? s.key}</label>
              <input
                style={adminInput}
                value={values[s.key] ?? ''}
                onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            style={{ ...adminBtn.primary, opacity: saving ? 0.7 : 1 }}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {message && <span className="text-sm text-green-700">{message}</span>}
        </div>
      </div>
    </div>
  )
}
