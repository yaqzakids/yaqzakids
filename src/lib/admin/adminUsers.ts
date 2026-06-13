import { supabase } from '@/lib/supabase'
import { MAIN_ADMIN_EMAIL } from '@/lib/constants'

export type AdminTeamRole = 'owner' | 'admin' | 'editor' | 'support'

export interface AdminTeamUser {
  id: string
  user_id: string | null
  email: string
  role: AdminTeamRole
  created_by: string | null
  created_at: string
}

export const ADMIN_TEAM_ROLE_OPTIONS: { value: Exclude<AdminTeamRole, 'owner'>; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'support', label: 'Support' },
]

export const ADMIN_TEAM_ROLE_LABELS: Record<AdminTeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  support: 'Support',
}

export function isMainAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === MAIN_ADMIN_EMAIL
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

export async function fetchAdminTeamUsers(): Promise<AdminTeamUser[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, user_id, email, role, created_by, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as AdminTeamUser[]
}

export async function addAdminTeamUser(
  email: string,
  role: Exclude<AdminTeamRole, 'owner'>
): Promise<AdminTeamUser> {
  const { data, error } = await supabase.rpc('add_admin_user', {
    p_email: email.trim().toLowerCase(),
    p_role: role,
  })
  if (error) throw error
  return data as AdminTeamUser
}

export async function removeAdminTeamUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('remove_admin_user', { p_id: id })
  if (error) throw error
}
