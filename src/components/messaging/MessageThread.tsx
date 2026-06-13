import { FormEvent, useMemo, useState } from 'react'
import { getMessageStatus, statusLabel } from '@/lib/messaging/constants'
import type { ConversationDetail, DirectMessageRow } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'

interface MessageThreadProps {
  detail: ConversationDetail
  currentUserId: string
  onSend: (message: string) => Promise<void>
  sending?: boolean
  variant?: 'parent' | 'admin'
  readOnly?: boolean
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
    return <span className="text-[10px] opacity-70 ml-1">{statusLabel(status)}</span>
  }

  const bubbleFor = (msg: DirectMessageRow) => {
    const isAdmin = msg.sender_type === 'admin'
    const isMine = msg.sender_id === currentUserId

    if (variant === 'parent') {
      if (isAdmin) {
        return { align: 'justify-start', className: 'bg-navy text-white rounded-bl-md' }
      }
      return { align: 'justify-end', className: 'bg-gray-100 text-navy rounded-br-md' }
    }

    if (isAdmin && isMine) {
      return { align: 'justify-end', className: 'bg-navy text-white rounded-br-md' }
    }
    return { align: 'justify-start', className: 'bg-gray-100 text-navy rounded-bl-md' }
  }

  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {detail.messages.map((msg) => {
          const isAdmin = msg.sender_type === 'admin'
          const { align, className } = bubbleFor(msg)

          return (
            <div key={msg.id} className={`flex ${align}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${className}`}>
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 m-0 mb-1">
                  {isAdmin ? 'Yaqza Team' : 'Parent'} · {formatDateTime(msg.created_at)}
                  {renderStatus(msg)}
                </p>
                <p className="m-0">{msg.message}</p>
              </div>
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <form onSubmit={(e) => void handleSubmit(e)} className="border-t border-gray-100 p-4 space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-sm text-navy min-h-[90px] resize-y focus:outline-none focus:border-teal"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-gold text-white rounded-full px-6 py-2.5 font-extrabold border-0 cursor-pointer disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </form>
      )}
      {readOnly && (
        <div className="border-t border-gray-100 p-4">
          <p className="text-xs text-muted m-0 text-center">
            This is a broadcast from Yaqza Kids. Replies are not available for broadcasts.
          </p>
        </div>
      )}
    </div>
  )
}
