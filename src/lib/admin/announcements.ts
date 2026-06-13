import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import type { AnnouncementAudience } from '@/lib/messaging/constants'
import type { AnnouncementRow } from '@/lib/messaging/types'

export async function fetchAnnouncements(): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createAnnouncement(
  adminId: string,
  input: { title: string; message: string; audience: AnnouncementAudience }
): Promise<AnnouncementRow> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: input.title.trim(),
      message: input.message.trim(),
      audience: input.audience,
      created_by: adminId,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) throw error
  await logAdminAction('announcement_created', 'announcement', data.id, { audience: input.audience })
  return data as AnnouncementRow
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<{ title: string; message: string; audience: AnnouncementAudience; is_active: boolean }>
): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  await logAdminAction('announcement_updated', 'announcement', id, updates as Record<string, unknown>)
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
  await logAdminAction('announcement_deleted', 'announcement', id)
}
