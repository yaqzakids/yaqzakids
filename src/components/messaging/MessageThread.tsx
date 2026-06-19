import { FormEvent, useMemo, useState } from 'react'
import { getMessageStatus, statusLabel } from '@/lib/messaging/constants'
import type { ConversationDetail, DirectMessageRow } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'
import { SITE_EMAILS } from '@/lib/constants'

interface MessageThreadProps {
  detail: ConversationDetail
  currentUserId: string
  onSend: (message: string) => Promise<void>
  sending?: boolean
  variant?: 'parent' | 'admin'
  readOnly?: boolean
}

function senderMeta(
  msg: DirectMessageRow,
  detail: ConversationDetail,
  variant: 'parent' | 'admin'
): { name: string; role: string; email: string | null } {
  const participant = detail.participants.find((p) => p.user_id === msg.sender_id)
  if (msg.sender_type === 'admin') {
    return {
      name: participant?.profile?.full_name ?? 'Yaqza Team',
      role: 'Admin',
      email: participant?.profile?.email ?? SITE_EMAILS.contact,
    }
  }
  const parent = detail.parent
  return {
    name: parent?.full_name ?? participant?.profile?.full_name ?? 'Parent',
    role: variant === 'admin' ? 'Parent' : 'You',
    email: parent?.email ?? participant?.profile?.email ?? null,
  }
}

export default function MessageThread({
  detail,
  currentUserId,
  onSend,
  sending = false,
  variant = 'parent',
  readOnly = false,
}: MessageThreadProps) {
  const [reply, setReply] = useState('')

  const otherLastReads = useMemo(
    () =>
      detail.participants
        .filter((p) => p.user_id !== currentUserId)
        .map((p) => p.last_read_at),
    [detail.participants, currentUserId]
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || sending) return
    await onSend(reply.trim())
    setReply('')
  }

  const renderStatus = (msg: DirectMessageRow) => {
    const status = getMessageStatus(msg.created_at, msg.sender_id ?? '', currentUserId, otherLastReads)
    if (!status) return null
    return <span className="text-[10px] opacity-70 ml-1 uppercase tracking-wide">{statusLabel(status)}</span>
  }

  const bubbleFor = (msg: DirectMessageRow) => {
    const isAdmin = msg.sender_type === 'admin'
    const isMine = msg.sender_id === currentUserId

    if (variant === 'parent') {
      if (isAdmin) {
        return { align: 'justify-start', className: 'bg-[#1B2F5E] text-white rounded-bl-md' }
      }
      return { align: 'justify-end', className: 'bg-[#EEF4FF] text-[#1B2F5E] border border-[#E2EBF8] rounded-br-md' }
    }

    if (isAdmin && isMine) {
      return { align: 'justify-end', className: 'bg-[#1B2F5E] text-white rounded-br-md' }
    }
    return { align: 'justify-start', className: 'bg-[#EEF4FF] text-[#1B2F5E] border border-[#E2EBF8] rounded-bl-md' }
  }

  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 md:p-5">
        {detail.messages.map((msg) => {
          const meta = senderMeta(msg, detail, variant)
          const { align, className } = bubbleFor(msg)

          return (
            <div key={msg.id} className={`flex ${align}`}>
              <div className={`max-w-[min(85%,640px)] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${className}`}>
                <div className="mb-2 pb-2 border-b border-white/10">
                  <p className="text-xs font-extrabold m-0">
                    {meta.name} ({meta.role})
                  </p>
                  {meta.email && (
                    <p className="text-[10px] opacity-75 m-0 mt-0.5">{meta.email}</p>
                  )}
                  <p className="text-[10px] opacity-70 m-0 mt-1">
                    {formatDateTime(msg.created_at)}
                    {renderStatus(msg)}
                  </p>
                </div>
                <p className="m-0 leading-relaxed">{msg.message}</p>
              </div>
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="border-t border-gray-100 p-4 bg-white sticky bottom-0"
        >
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-sm text-navy min-h-[88px] resize-y focus:outline-none focus:border-teal"
            required
          />
          <div className="flex items-center justify-between gap-3 mt-2">
            <span className="text-xs text-gray-400">📎 Attachments coming soon</span>
            <button
              type="submit"
              disabled={sending}
              className="bg-[#F5A623] text-white rounded-full px-6 py-2.5 font-extrabold border-0 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {sending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </form>
      )}
      {readOnly && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <p className="text-xs text-muted m-0 text-center">
            This is a broadcast from Yaqza Kids. Replies are not available for broadcasts.
          </p>
        </div>
      )}
    </div>
  )
}
