import { Link } from 'react-router-dom'
import MessageThread from '@/components/messaging/MessageThread'
import { MessagingThreadSkeleton } from '@/components/messaging/MessagingSkeleton'
import {
  familyMessageTypeMeta,
  type FamilyFeedItem,
} from '@/lib/messaging/familyFeed'
import type { ConversationDetail } from '@/lib/messaging/types'
import { SITE_EMAILS } from '@/lib/constants'
import { formatDateTime } from '@/lib/admin/utils'

interface ParentMessageDetailProps {
  item: FamilyFeedItem | null
  detail: ConversationDetail | null
  detailLoading: boolean
  currentUserId: string
  sending: boolean
  tab: 'inbox' | 'announcements' | 'archived'
  onSend: (message: string) => Promise<void>
  onArchive: () => void
  onMarkUnread: () => void
}

export default function ParentMessageDetail({
  item,
  detail,
  detailLoading,
  currentUserId,
  sending,
  tab,
  onSend,
  onArchive,
  onMarkUnread,
}: ParentMessageDetailProps) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[480px] p-8 text-center bg-[#FAFBFD]">
        <p className="text-5xl mb-4" aria-hidden>
          💬
        </p>
        <h2 className="font-display text-xl font-bold text-[#1B2F5E] m-0 mb-2">Your family inbox</h2>
        <p className="text-sm text-[#6B7280] m-0 max-w-sm leading-relaxed">
          Select a message to read announcements, celebrate achievements, or chat with the Yaqza
          team.
        </p>
      </div>
    )
  }

  if (detailLoading) {
    return <MessagingThreadSkeleton />
  }

  const meta = familyMessageTypeMeta(item.type)
  const isDirect = item.type === 'direct' && detail
  const showReadOnlyThread = Boolean(detail && item.conversationId && item.type === 'announcement')

  return (
    <div className="flex flex-col h-full min-h-[560px]">
      <header className="p-5 border-b border-[#EEF4FF] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-3xl shrink-0" aria-hidden>
              {meta.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#2AAFA0] m-0 mb-1">
                {meta.label}
              </p>
              {isDirect || item.type === 'direct' ? (
                <>
                  <h2 className="font-display font-bold text-[#1B2F5E] m-0 text-lg">Yaqza Team</h2>
                  <p className="text-sm text-[#2AAFA0] font-semibold m-0">{SITE_EMAILS.contact}</p>
                  <span className="inline-block mt-2 text-[10px] font-extrabold uppercase tracking-wide text-[#1B2F5E] bg-[#EEF4FF] px-2 py-0.5 rounded-full">
                    Official
                  </span>
                </>
              ) : (
                <h2 className="font-display font-bold text-[#1B2F5E] m-0 text-lg line-clamp-2">
                  {item.title.replace(/^[^\s]+\s/, '')}
                </h2>
              )}
              <p className="text-xs text-[#9CA3AF] m-0 mt-2">{formatDateTime(item.date)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {!item.readOnly && (
              <button
                type="button"
                onClick={() => void onMarkUnread()}
                className="text-xs font-bold text-[#1B2F5E] border border-[#E2EBF8] rounded-full px-3 py-1.5 bg-white cursor-pointer hover:bg-[#EEF4FF]"
              >
                Mark unread
              </button>
            )}
            <button
              type="button"
              onClick={() => void onArchive()}
              className="text-xs font-bold text-[#2AAFA0] border border-[#2AAFA0] rounded-full px-3 py-1.5 bg-white cursor-pointer hover:bg-[#2AAFA0]/5"
            >
              {tab === 'archived' ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>
      </header>

      {isDirect && detail ? (
        <div className="flex-1 min-h-0">
          <MessageThread
            detail={detail}
            currentUserId={currentUserId}
            onSend={onSend}
            sending={sending}
            variant="parent"
            readOnly={false}
          />
        </div>
      ) : showReadOnlyThread && detail ? (
        <div className="flex-1 min-h-0">
          <MessageThread
            detail={detail}
            currentUserId={currentUserId}
            onSend={onSend}
            sending={sending}
            variant="parent"
            readOnly
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          <div className="max-w-2xl">
            <div className="bg-[#EEF4FF] rounded-2xl p-5 md:p-6 border border-[#E2EBF8]">
              <p className="text-[#1B2F5E] whitespace-pre-wrap leading-relaxed m-0 text-sm md:text-base">
                {detail?.messages?.[0]?.message ?? item.body}
              </p>
            </div>

            {item.childName && item.type === 'achievement' && (
              <p className="text-sm text-[#6B7280] mt-4 m-0">
                🎉 Celebrate with <span className="font-bold text-[#1B2F5E]">{item.childName}</span>{' '}
                — every milestone matters!
              </p>
            )}

            {item.actions.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                {item.actions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-extrabold no-underline transition-opacity hover:opacity-90 ${
                      action.primary
                        ? 'bg-[#F5A623] text-white'
                        : 'bg-white text-[#1B2F5E] border border-[#E2EBF8]'
                    }`}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}

            {item.readOnly && item.type === 'announcement' && (
              <p className="text-xs text-[#9CA3AF] mt-6 m-0 text-center">
                This is an official announcement from Yaqza Kids. Replies are not available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
