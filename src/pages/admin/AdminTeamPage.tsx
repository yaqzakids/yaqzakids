import { useEffect, useRef, useState } from 'react'
import { useAdminRole } from '@/context/AdminRoleContext'
import {
  ADMIN_TEAM_ROLE_LABELS,
  ADMIN_TEAM_ROLE_OPTIONS,
  ADMIN_TEAM_STATUS_LABELS,
  ADMIN_TEAM_STATUS_OPTIONS,
  createEmployeeAccount,
  fetchAdminTeamUsers,
  isMainAdminEmail,
  removeAdminTeamUser,
  resetEmployeePassword,
  updateAdminTeamMember,
  type AdminTeamRole,
  type AdminTeamStatus,
  type AdminTeamUser,
} from '@/lib/admin/adminUsers'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDateTime } from '@/lib/admin/utils'
import { sendTeamCredentialsEmail } from '@/lib/admin/teamCredentialsEmail'
import { MAIN_ADMIN_EMAIL } from '@/lib/constants'

function roleBadgeVariant(role: AdminTeamRole): 'success' | 'warning' | 'muted' | 'gold' {
  if (role === 'owner') return 'gold'
  if (role === 'admin') return 'success'
  if (role === 'editor' || role === 'content_writer') return 'muted'
  if (role === 'reviewer') return 'warning'
  return 'warning'
}

function statusBadgeVariant(status: AdminTeamStatus): 'success' | 'warning' | 'muted' {
  if (status === 'active') return 'success'
  if (status === 'invited') return 'warning'
  return 'muted'
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  let result = ''
  for (let i = 0; i < 14; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function AdminTeamPage() {
  const { isOwner } = useAdminRole()
  const [rows, setRows] = useState<AdminTeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [role, setRole] = useState<Exclude<AdminTeamRole, 'owner'>>('editor')
  const [status, setStatus] = useState<AdminTeamStatus>('active')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [passwordForEmail, setPasswordForEmail] = useState<string | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Exclude<AdminTeamRole, 'owner'>>('editor')
  const [emailCredentials, setEmailCredentials] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const passwordBannerRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      setRows(await fetchAdminTeamUsers())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load team accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOwner) void load()
  }, [isOwner])

  useEffect(() => {
    if (createdPassword && passwordBannerRef.current) {
      passwordBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [createdPassword])

  const showPasswordBanner = (password: string, forEmail: string) => {
    setCreatedPassword(password)
    setPasswordForEmail(forEmail)
    setPasswordCopied(false)
  }

  const dismissPasswordBanner = () => {
    setCreatedPassword(null)
    setPasswordForEmail(null)
    setPasswordCopied(false)
  }

  if (!isOwner) {
    return (
      <div style={adminCard}>
        <p style={{ margin: 0, color: '#6B7280' }}>
          Only the owner ({MAIN_ADMIN_EMAIL}) can manage team and employee accounts.
        </p>
      </div>
    )
  }

  const handleGeneratePassword = () => {
    setTempPassword(generateTempPassword())
    setError(null)
  }

  const trySendCredentialsEmail = async (
    toEmail: string,
    password: string,
    options?: { fullName?: string; isReset?: boolean }
  ): Promise<string | null> => {
    if (!emailCredentials) return null
    setSendingEmail(true)
    try {
      const result = await sendTeamCredentialsEmail({
        toEmail,
        fullName: options?.fullName ?? fullName,
        temporaryPassword: password,
        isReset: options?.isReset,
      })
      if (result.sent) {
        setPasswordCopied(true)
        return result.message
      }
      if (result.skipped) return `${result.message} Copy the password below manually.`
      return `Account saved, but email failed: ${result.message}`
    } finally {
      setSendingEmail(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    dismissPasswordBanner()

    const password = tempPassword.trim()
    if (password.length < 8) {
      setError('Enter a temporary password (at least 8 characters) or click Generate password.')
      return
    }

    setSaving(true)

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = fullName.trim()

    try {
      await createEmployeeAccount({
        fullName: trimmedName,
        email: trimmedEmail,
        password,
        role,
        status,
      })
      showPasswordBanner(password, trimmedEmail)
      const emailNote = await trySendCredentialsEmail(trimmedEmail, password, { fullName: trimmedName })
      setFullName('')
      setEmail('')
      setTempPassword('')
      setRole('editor')
      setStatus('active')
      setMessage(
        emailNote ??
          'Employee account created. Copy the password below, then share it with your team member.'
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create employee account.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyPassword = async () => {
    if (!createdPassword) return
    try {
      await navigator.clipboard.writeText(createdPassword)
      setPasswordCopied(true)
      setMessage('Temporary password copied.')
    } catch {
      setError('Could not copy automatically — select the password and copy manually.')
    }
  }

  const handleSendCredentialsEmail = async () => {
    if (!createdPassword || !passwordForEmail) return
    setError(null)
    const row = rows.find((r) => r.email === passwordForEmail)
    const note = await trySendCredentialsEmail(passwordForEmail, createdPassword, {
      fullName: row?.full_name ?? undefined,
      isReset: Boolean(row?.user_id),
    })
    if (note?.startsWith('Account saved, but email failed')) {
      setError(note.replace('Account saved, but email failed: ', ''))
    } else if (note) {
      setMessage(note)
    }
  }

  const handleSaveRole = async (row: AdminTeamUser) => {
    setError(null)
    try {
      await updateAdminTeamMember(row.id, { role: editRole })
      setEditingId(null)
      setMessage('Role updated.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update role.')
    }
  }

  const handleSuspend = async (row: AdminTeamUser) => {
    const nextStatus: AdminTeamStatus = row.status === 'suspended' ? 'active' : 'suspended'
    if (!confirm(`${nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'} ${row.email}?`)) return
    setError(null)
    try {
      await updateAdminTeamMember(row.id, { status: nextStatus })
      setMessage(nextStatus === 'suspended' ? 'Account suspended.' : 'Account reactivated.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.')
    }
  }

  const handleSetOrResetPassword = async (row: AdminTeamUser) => {
    const newPassword = generateTempPassword()
    const action = row.user_id ? 'Reset login password' : 'Create login password'
    if (!confirm(`${action} for ${row.email}? A new temporary password will be generated.`)) return
    setError(null)
    dismissPasswordBanner()
    try {
      await resetEmployeePassword(row.id, newPassword)
      showPasswordBanner(newPassword, row.email)
      const emailNote = await trySendCredentialsEmail(row.email, newPassword, {
        fullName: row.full_name ?? undefined,
        isReset: Boolean(row.user_id),
      })
      setMessage(
        emailNote ??
          (row.user_id
            ? `New temporary password for ${row.email}. They sign in at /admin/login and must change it on first login.`
            : `Login created for ${row.email}. They sign in at /admin/login with this password.`)
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set password.')
    }
  }

  const handleRemove = async (row: AdminTeamUser) => {
    if (isMainAdminEmail(row.email)) return
    if (!confirm(`Remove team access for ${row.email}? This does not delete their auth account.`)) return
    setError(null)
    try {
      await removeAdminTeamUser(row.id)
      setMessage('Team member removed.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove team member.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'Playfair Display, serif',
            color: '#1B2F5E',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 800,
          }}
        >
          Team / Employee Accounts
        </h1>
        <p style={{ margin: '8px 0 0', color: '#6B7280', maxWidth: 720, lineHeight: 1.6 }}>
          Set a temporary password for each team member. When email is configured, login details are sent
          automatically. They sign in at <strong>/admin/login</strong> (not the parent login).
        </p>
      </div>

      {createdPassword && (
        <div
          ref={passwordBannerRef}
          style={{
            padding: 20,
            background: '#FEF3C7',
            borderRadius: 12,
            border: '2px solid #F59E0B',
          }}
        >
          <p style={{ margin: '0 0 4px', color: '#92400E', fontWeight: 800, fontSize: 16 }}>
            Temporary password {passwordForEmail ? `for ${passwordForEmail}` : ''}
          </p>
          <p style={{ margin: '0 0 12px', color: '#78350F', fontSize: 14, lineHeight: 1.5 }}>
            Share this with your team member if email was not sent. They sign in at{' '}
            <strong>/admin/login</strong>, then choose a new password on first sign-in.
          </p>
          <div
            style={{
              padding: '12px 16px',
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #FCD34D',
              marginBottom: 12,
            }}
          >
            <code style={{ fontSize: 18, fontWeight: 700, wordBreak: 'break-all', color: '#1B2F5E' }}>
              {createdPassword}
            </code>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              style={adminBtn.primary}
              onClick={() => void handleSendCredentialsEmail()}
              disabled={sendingEmail}
            >
              {sendingEmail ? 'Sending…' : 'Email login details'}
            </button>
            <button type="button" style={adminBtn.secondary} onClick={() => void handleCopyPassword()}>
              {passwordCopied ? 'Copied ✓' : 'Copy temporary password'}
            </button>
            <button
              type="button"
              style={adminBtn.secondary}
              onClick={dismissPasswordBanner}
              disabled={!passwordCopied}
              title={passwordCopied ? undefined : 'Copy the password or send email first'}
            >
              Done — hide password
            </button>
          </div>
          {!passwordCopied && (
            <p style={{ margin: '10px 0 0', color: '#92400E', fontSize: 13 }}>
              Copy the password or send the email before dismissing this banner.
            </p>
          )}
        </div>
      )}

      <div style={adminCard}>
        <h2 style={{ margin: '0 0 16px', fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
          Create Employee Account
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
          <input
            type="text"
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={adminInput}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={adminInput}
          />
          <div className="flex gap-2 md:col-span-2 max-w-xl">
            <input
              type="text"
              required
              minLength={8}
              placeholder="Temporary password (min 8 characters)"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              style={{ ...adminInput, flex: 1 }}
              autoComplete="new-password"
            />
            <button type="button" style={adminBtn.secondary} onClick={handleGeneratePassword}>
              Generate
            </button>
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Exclude<AdminTeamRole, 'owner'>)}
            style={adminInput}
          >
            {ADMIN_TEAM_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminTeamStatus)}
            style={adminInput}
          >
            {ADMIN_TEAM_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="submit" style={adminBtn.primary} disabled={saving || tempPassword.trim().length < 8}>
            {saving ? 'Creating…' : 'Create account'}
          </button>
          <label
            className="md:col-span-2 flex items-center gap-2 text-sm text-[#6B7280] cursor-pointer"
            style={{ margin: 0 }}
          >
            <input
              type="checkbox"
              checked={emailCredentials}
              onChange={(e) => setEmailCredentials(e.target.checked)}
            />
            Email login details to the team member automatically (requires Resend in Supabase)
          </label>
        </form>

        {message && !createdPassword && (
          <p style={{ margin: '12px 0 0', color: '#2AAFA0', fontWeight: 700 }}>{message}</p>
        )}
        {error && <p style={{ margin: '12px 0 0', color: '#dc2626', fontWeight: 700 }}>{error}</p>}
      </div>

      {loading ? (
        <CardSkeleton count={1} />
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAF8F2' }}>
                {['Name', 'Email', 'Login', 'Role', 'Status', 'Created', 'Last login', 'Actions'].map((h) => (
                  <th key={h} style={adminTableTh}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#F0EDE6]">
                  <td style={adminTableTd}>
                    <span style={{ fontWeight: 700, color: '#1B2F5E' }}>{row.full_name || '—'}</span>
                  </td>
                  <td style={adminTableTd}>
                    {row.email}
                    {isMainAdminEmail(row.email) && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#6B7280' }}>(owner)</span>
                    )}
                  </td>
                  <td style={adminTableTd}>
                    {isMainAdminEmail(row.email) ? (
                      <span style={{ fontSize: 13, color: '#6B7280' }}>Owner account</span>
                    ) : row.user_id ? (
                      <StatusBadge label="Can sign in" variant="success" />
                    ) : (
                      <StatusBadge label="No password yet" variant="warning" />
                    )}
                  </td>
                  <td style={adminTableTd}>
                    {editingId === row.id && !isMainAdminEmail(row.email) ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as Exclude<AdminTeamRole, 'owner'>)
                          }
                          style={{ ...adminInput, padding: '6px 8px', fontSize: 13 }}
                        >
                          {ADMIN_TEAM_ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button type="button" style={adminBtn.primary} onClick={() => void handleSaveRole(row)}>
                          Save
                        </button>
                        <button type="button" style={adminBtn.secondary} onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <StatusBadge
                        label={ADMIN_TEAM_ROLE_LABELS[row.role]}
                        variant={roleBadgeVariant(row.role)}
                      />
                    )}
                  </td>
                  <td style={adminTableTd}>
                    <StatusBadge
                      label={ADMIN_TEAM_STATUS_LABELS[row.status] ?? row.status}
                      variant={statusBadgeVariant(row.status)}
                    />
                  </td>
                  <td style={adminTableTd}>{formatDateTime(row.created_at)}</td>
                  <td style={adminTableTd}>
                    {row.last_login_at ? formatDateTime(row.last_login_at) : '—'}
                  </td>
                  <td style={adminTableTd}>
                    {!isMainAdminEmail(row.email) && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          style={adminBtn.primary}
                          onClick={() => void handleSetOrResetPassword(row)}
                        >
                          {row.user_id ? 'Reset password' : 'Set login password'}
                        </button>
                        <button
                          type="button"
                          style={adminBtn.secondary}
                          onClick={() => {
                            setEditingId(row.id)
                            setEditRole(row.role === 'owner' ? 'admin' : row.role)
                          }}
                        >
                          Edit role
                        </button>
                        <button type="button" style={adminBtn.secondary} onClick={() => void handleSuspend(row)}>
                          {row.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                        <button type="button" style={adminBtn.danger} onClick={() => void handleRemove(row)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
