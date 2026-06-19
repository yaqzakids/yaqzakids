import { supabase } from '@/lib/supabase'
import { MAIN_ADMIN_EMAIL } from '@/lib/constants'

export type AdminTeamRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'support'
  | 'content_writer'
  | 'reviewer'

export type AdminTeamStatus = 'active' | 'invited' | 'suspended'

export interface AdminTeamUser {
  id: string
  user_id: string | null
  email: string
  full_name: string | null
  role: AdminTeamRole
  status: AdminTeamStatus
  must_change_password: boolean
  created_by: string | null
  created_at: string
  last_login_at: string | null
}

export const ADMIN_TEAM_ROLE_OPTIONS: {
  value: Exclude<AdminTeamRole, 'owner'>
  label: string
}[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'content_writer', label: 'Content Writer' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'support', label: 'Support' },
]

export const ADMIN_TEAM_STATUS_OPTIONS: { value: AdminTeamStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
]

export const ADMIN_TEAM_ROLE_LABELS: Record<AdminTeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  support: 'Support',
  content_writer: 'Content Writer',
  reviewer: 'Reviewer',
}

export const ADMIN_TEAM_STATUS_LABELS: Record<AdminTeamStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
}

export interface CreateEmployeeInput {
  fullName: string
  email: string
  password: string
  role: Exclude<AdminTeamRole, 'owner'>
  status: AdminTeamStatus
}

export interface CreateEmployeeResult {
  employee: AdminTeamUser
}

export function isMainAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === MAIN_ADMIN_EMAIL
}

function isMissingSchemaError(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? ''
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    /could not find the function|schema cache|does not exist/i.test(message)
  )
}

function mapLegacyAdminRow(row: Record<string, unknown>): AdminTeamUser {
  return {
    id: String(row.id),
    user_id: (row.user_id as string | null) ?? null,
    email: String(row.email),
    full_name: (row.full_name as string | null) ?? null,
    role: (row.role as AdminTeamRole) ?? 'admin',
    status: (row.status as AdminTeamStatus) ?? 'active',
    must_change_password: Boolean(row.must_change_password ?? false),
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    last_login_at: (row.last_login_at as string | null) ?? null,
  }
}

export async function linkAdminUserAccount(): Promise<void> {
  await supabase.rpc('link_admin_user_account')
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw error
  return Boolean(data)
}

export async function checkIsAdminOwner(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin_owner')
  if (error) throw error
  return Boolean(data)
}

export async function checkIsAuthorizedAdmin(
  user?: { id: string; email?: string | null } | null
): Promise<boolean> {
  let authUser = user
  if (!authUser) {
    const {
      data: { user: fetched },
    } = await supabase.auth.getUser()
    authUser = fetched
  }
  if (!authUser) return false

  if (isMainAdminEmail(authUser.email)) return true

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle()
  if (profile?.role === 'admin') return true

  const normalized = (authUser.email ?? '').trim().toLowerCase()
  if (normalized) {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, status')
      .eq('email', normalized)
      .maybeSingle()

    if (!error && adminUser?.status === 'active') return true
  }

  try {
    await linkAdminUserAccount()
    const { data, error } = await supabase.rpc('is_active_admin_user')
    if (!error && data) return true
    return checkIsAdmin()
  } catch {
    return false
  }
}

export async function checkIsActiveAdmin(): Promise<boolean> {
  return checkIsAuthorizedAdmin()
}

async function invokeAdminFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('You must be signed in as the owner.')
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error) {
    const msg = error.message || ''
    if (/failed to send a request to the edge function|functionsrelayerror|404/i.test(msg)) {
      throw new Error(
        'Team login is not set up yet. Run supabase/apply_team_auth_rpc.sql in the Supabase SQL Editor, then try again.'
      )
    }
    throw new Error(error.message || `Failed to call ${name}`)
  }

  const payload = data as { error?: string }
  if (payload?.error) {
    throw new Error(payload.error)
  }

  return data as T
}

export async function createEmployeeAccount(
  input: CreateEmployeeInput
): Promise<CreateEmployeeResult> {
  const { data, error } = await supabase.rpc('create_employee_account', {
    p_email: input.email.trim().toLowerCase(),
    p_password: input.password,
    p_full_name: input.fullName.trim() || null,
    p_role: input.role,
    p_status: input.status,
  })

  if (!error && data) {
    return { employee: data as AdminTeamUser }
  }

  if (error && !isMissingSchemaError(error)) {
    throw new Error(error.message)
  }

  return invokeAdminFunction<CreateEmployeeResult>('create-employee-user', {
    email: input.email.trim().toLowerCase(),
    password: input.password,
    fullName: input.fullName.trim(),
    role: input.role,
    status: input.status,
  })
}

export async function resetEmployeePassword(adminUserId: string, password: string): Promise<void> {
  const { error } = await supabase.rpc('reset_employee_account_password', {
    p_admin_user_id: adminUserId,
    p_password: password,
  })

  if (!error) return

  if (error && !isMissingSchemaError(error)) {
    throw new Error(error.message)
  }

  await invokeAdminFunction<{ success: boolean }>('reset-employee-password', {
    adminUserId,
    password,
  })
}

export async function fetchAdminTeamUsers(): Promise<AdminTeamUser[]> {
  const extendedSelect =
    'id, user_id, email, full_name, role, status, must_change_password, created_by, created_at, last_login_at'

  const { data, error } = await supabase.from('admin_users').select(extendedSelect).order('created_at', {
    ascending: true,
  })

  if (!error) {
    return (data ?? []) as AdminTeamUser[]
  }

  if (!isMissingSchemaError(error) && error.code !== 'PGRST204') {
    throw error
  }

  const { data: legacy, error: legacyError } = await supabase
    .from('admin_users')
    .select('id, user_id, email, role, created_by, created_at')
    .order('created_at', { ascending: true })

  if (legacyError) throw legacyError
  return (legacy ?? []).map((row) => mapLegacyAdminRow(row as Record<string, unknown>))
}

export async function updateAdminTeamMember(
  id: string,
  updates: {
    role?: Exclude<AdminTeamRole, 'owner'>
    status?: AdminTeamStatus
    fullName?: string
    mustChangePassword?: boolean
  }
): Promise<AdminTeamUser> {
  const { data, error } = await supabase.rpc('update_admin_team_member', {
    p_id: id,
    p_role: updates.role ?? null,
    p_status: updates.status ?? null,
    p_full_name: updates.fullName ?? null,
    p_must_change_password: updates.mustChangePassword ?? null,
  })
  if (error) throw error
  return data as AdminTeamUser
}

export async function removeAdminTeamUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('remove_admin_user', { p_id: id })
  if (error) throw error
}

export async function checkMustChangePassword(): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_must_change_password')
  if (error) {
    if (isMissingSchemaError(error)) return false
    throw error
  }
  return Boolean(data)
}

export async function recordAdminLogin(): Promise<void> {
  const { error } = await supabase.rpc('record_admin_login')
  if (error && !isMissingSchemaError(error)) {
    throw error
  }
}

export async function clearMustChangePassword(): Promise<void> {
  const { error } = await supabase.rpc('clear_admin_must_change_password')
  if (error && !isMissingSchemaError(error)) {
    throw error
  }
}

export async function isEmailAuthorizedForAdmin(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  if (isMainAdminEmail(normalized)) return true

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', normalized)
    .eq('status', 'active')
    .maybeSingle()

  if (error) return false
  return Boolean(data)
}
