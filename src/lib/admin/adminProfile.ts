import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import { isPresetAvatarId } from '@/lib/avatar/presetAvatars'

export const DEFAULT_ADMIN_DISPLAY_NAME = 'Reem Helles'
export const DEFAULT_ADMIN_TITLE = 'Founder & Owner'
export const DEFAULT_PUBLIC_CONTACT_EMAIL = 'hello@yaqzakids.com'

export interface AdminProfileData {
  id: string
  full_name: string | null
  title: string | null
  public_contact_email: string | null
  avatar_id: string | null
  role: string
}

export interface ResolvedAdminDisplay {
  displayName: string
  title: string
  publicContactEmail: string
  loginEmail: string | null
  avatarId: string | null
}

export function resolveDisplayName(
  authUser: User | null,
  profile: AdminProfileData | null,
): string {
  const metaName = authUser?.user_metadata?.full_name
  if (typeof metaName === 'string' && metaName.trim()) {
    return metaName.trim()
  }
  if (profile?.full_name?.trim()) {
    return profile.full_name.trim()
  }
  return DEFAULT_ADMIN_DISPLAY_NAME
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('getUser error:', error)
  }

  if (user?.email) {
    return user
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.error('getSession error:', sessionError)
  }

  return session?.user ?? user ?? null
}

export async function fetchAdminProfile(userId: string): Promise<AdminProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, title, public_contact_email, avatar_id, role')
    .eq('id', userId)
    .maybeSingle()

  if (!error) {
    return data as AdminProfileData
  }

  const { data: basic, error: basicError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_id, role')
    .eq('id', userId)
    .maybeSingle()

  if (basicError) throw basicError
  if (!basic) return null

  return {
    ...basic,
    title: null,
    public_contact_email: null,
    avatar_id: (basic as AdminProfileData).avatar_id ?? null,
  } as AdminProfileData
}

export async function loadAdminDisplay(userId: string): Promise<ResolvedAdminDisplay> {
  const authUser = await getAuthenticatedUser()
  const profile = await fetchAdminProfile(userId).catch(() => null)

  return {
    displayName: resolveDisplayName(authUser, profile),
    title: profile?.title?.trim() || DEFAULT_ADMIN_TITLE,
    publicContactEmail: profile?.public_contact_email?.trim() || DEFAULT_PUBLIC_CONTACT_EMAIL,
    loginEmail: authUser?.email ?? null,
    avatarId: isPresetAvatarId(profile?.avatar_id) ? profile.avatar_id : null,
  }
}

export interface AdminProfileUpdate {
  full_name: string
  title: string
  public_contact_email: string
  avatar_id?: string | null
}

export async function updateAdminProfile(userId: string, update: AdminProfileUpdate): Promise<void> {
  const full_name = update.full_name.trim()
  const title = update.title.trim()
  const public_contact_email = update.public_contact_email.trim()

  if (!full_name) throw new Error('Display name is required.')
  if (!title) throw new Error('Title is required.')
  if (!public_contact_email) throw new Error('Public contact email is required.')

  const payload: Record<string, string | null> = { full_name, title, public_contact_email }

  if (update.avatar_id !== undefined) {
    payload.avatar_id = update.avatar_id
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId)

  if (error) throw new Error(formatSupabaseError(error))
}

export async function updateAdminAvatarId(
  userId: string,
  avatarId: string | null,
): Promise<{ id: string; avatar_id: string | null }> {
  if (avatarId !== null && !isPresetAvatarId(avatarId)) {
    throw new Error('Invalid avatar selection.')
  }

  console.log('saving avatar id:', avatarId)
  console.log('saving for profile/user:', userId)

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_id: avatarId })
    .eq('id', userId)
    .select('id, avatar_id')
    .single()

  console.log('avatar save result:', data)
  console.log('avatar save error:', error)

  if (error) {
    throw new Error(formatSupabaseError(error))
  }
  if (!data) {
    throw new Error('No profile row was updated. Your session user id may not match profiles.id.')
  }

  return data
}

export async function changeAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })

  if (signInError) {
    throw new Error('Current password is incorrect.')
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) throw updateError
}
