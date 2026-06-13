import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useAdminRole, ADMIN_ROLE_LABELS } from '@/context/AdminRoleContext'
import { useAdminShell } from '@/context/AdminShellContext'
import AdminAvatar from '@/components/admin/AdminAvatar'
import AvatarSelectorModal from '@/components/avatar/AvatarSelectorModal'
import StatusBadge from '@/components/admin/StatusBadge'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import { adminBtn, adminCard, adminInput } from '@/lib/admin/styles'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'
import { isPresetAvatarId, type PresetAvatarId } from '@/lib/avatar/presetAvatars'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import {
  changeAdminPassword,
  DEFAULT_ADMIN_DISPLAY_NAME,
  DEFAULT_ADMIN_TITLE,
  DEFAULT_PUBLIC_CONTACT_EMAIL,
  getAuthenticatedUser,
  loadAdminDisplay,
  updateAdminAvatarId,
  updateAdminProfile,
} from '@/lib/admin/adminProfile'

export default function AdminProfileSettingsPage() {
  const { user } = useAuth()
  const { adminRole } = useAdminRole()
  const { refreshAdminProfile } = useAdminShell()

  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState(DEFAULT_ADMIN_DISPLAY_NAME)
  const [title, setTitle] = useState(DEFAULT_ADMIN_TITLE)
  const [publicContactEmail, setPublicContactEmail] = useState(DEFAULT_PUBLIC_CONTACT_EMAIL)
  const [loginEmail, setLoginEmail] = useState<string | null>(null)
  const [loginEmailError, setLoginEmailError] = useState(false)
  const [savedAvatarId, setSavedAvatarId] = useState<PresetAvatarId | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)

  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        const display = await loadAdminDisplay(user.id)
        setDisplayName(display.displayName)
        setTitle(display.title)
        setPublicContactEmail(display.publicContactEmail)
        setSavedAvatarId(isPresetAvatarId(display.avatarId) ? display.avatarId : null)

        const authUser = await getAuthenticatedUser()
        if (authUser?.email) {
          setLoginEmail(authUser.email)
          setLoginEmailError(false)
        } else {
          setLoginEmail(null)
          setLoginEmailError(true)
        }
      } catch {
        setProfileError('Could not load profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const handleSaveAvatar = async (avatarId: PresetAvatarId) => {
    if (!user) return
    setSavingAvatar(true)
    setAvatarMessage(null)
    setAvatarError(null)
    console.log('saving avatar id:', avatarId)
    console.log('saving for profile/user:', user?.id)
    try {
      const result = await updateAdminAvatarId(user.id, avatarId)
      console.log('avatar save result:', result)
      setSavedAvatarId(avatarId)
      await refreshAdminProfile()
      setSelectorOpen(false)
      setAvatarMessage('Avatar saved successfully!')
    } catch (err) {
      console.log('avatar save error:', err)
      setAvatarError(formatSupabaseError(err))
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    setProfileMessage(null)
    setProfileError(null)
    try {
      await updateAdminProfile(user.id, {
        full_name: displayName,
        title,
        public_contact_email: publicContactEmail,
      })
      await refreshAdminProfile()
      setProfileMessage('Profile saved successfully.')
    } catch (err) {
      setProfileError(formatSupabaseError(err))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!loginEmail) {
      setPasswordError('No login email available for this account.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setChangingPassword(true)
    setPasswordMessage(null)
    setPasswordError(null)
    try {
      await changeAdminPassword(loginEmail, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated successfully.')
    } catch (err) {
      setPasswordError(formatSupabaseError(err))
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <CardSkeleton count={3} />

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/admin/settings" style={{ ...adminBtn.secondary, textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
          ← Back to Settings
        </Link>
        <h1 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: dashboardTheme.navy, fontSize: 28 }}>
          Profile Settings
        </h1>
        <p style={{ margin: '8px 0 0', color: dashboardTheme.muted, fontSize: 14 }}>
          Manage your avatar, profile details, and password.
        </p>
      </div>

      <div style={adminCard}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, color: dashboardTheme.navy }}>Choose Your Avatar</h2>
        <div className="flex flex-wrap items-center gap-5">
          <AdminAvatar name={displayName} avatarId={savedAvatarId} size={72} variant="profile" />
          <div className="flex-1 min-w-[200px]">
            <p style={{ margin: '0 0 12px', fontSize: 14, color: dashboardTheme.muted, lineHeight: 1.5 }}>
              Pick a fun avatar for your Yaqza Kids profile.
            </p>
            <button type="button" style={adminBtn.primary} onClick={() => { setAvatarError(null); setSelectorOpen(true) }}>
              Choose Your Avatar
            </button>
          </div>
        </div>
        {avatarMessage && <p style={{ margin: '12px 0 0', color: '#166534', fontSize: 14 }}>{avatarMessage}</p>}
      </div>

      <div style={adminCard}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, color: dashboardTheme.navy }}>Profile Information</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold mb-1">Display name</label>
            <input style={adminInput} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input style={adminInput} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Public contact email</label>
            <input style={adminInput} type="email" value={publicContactEmail} onChange={(e) => setPublicContactEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Login email</label>
            {loginEmailError ? (
              <p style={{ margin: 0, fontSize: 14, color: '#dc2626' }}>Unable to load login email</p>
            ) : (
              <input style={adminInput} value={loginEmail ?? ''} disabled readOnly />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Admin role</label>
            <div><StatusBadge label={ADMIN_ROLE_LABELS[adminRole]} variant="gold" /></div>
          </div>
          <button
            type="button"
            style={{ ...adminBtn.primary, opacity: savingProfile ? 0.7 : 1 }}
            disabled={savingProfile}
            onClick={handleSaveProfile}
          >
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
          {profileMessage && <p style={{ margin: 0, color: '#166534', fontSize: 14 }}>{profileMessage}</p>}
          {profileError && <p style={{ margin: 0, color: '#dc2626', fontSize: 14 }}>{profileError}</p>}
        </div>
      </div>

      <div style={adminCard}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, color: dashboardTheme.navy }}>Change Password</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold mb-1">Current password</label>
            <input type="password" style={adminInput} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">New password</label>
            <input type="password" style={adminInput} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Confirm new password</label>
            <input type="password" style={adminInput} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <button
            type="button"
            style={{ ...adminBtn.primary, opacity: changingPassword ? 0.7 : 1 }}
            disabled={changingPassword}
            onClick={handleChangePassword}
          >
            {changingPassword ? 'Updating…' : 'Update Password'}
          </button>
          {passwordMessage && <p style={{ margin: 0, color: '#166534', fontSize: 14 }}>{passwordMessage}</p>}
          {passwordError && <p style={{ margin: 0, color: '#dc2626', fontSize: 14 }}>{passwordError}</p>}
        </div>
      </div>

      <AvatarSelectorModal
        open={selectorOpen}
        selectedId={savedAvatarId}
        onClose={() => setSelectorOpen(false)}
        onSave={handleSaveAvatar}
        saving={savingAvatar}
        error={avatarError}
        variant="admin"
      />
    </div>
  )
}
