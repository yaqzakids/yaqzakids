import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import ErrorMessage from '@/components/ErrorMessage'
import ParentLayout from '@/components/layout/ParentLayout'
import SupportAttachmentLink from '@/components/support/SupportAttachmentLink'
import SupportPagination from '@/components/support/SupportPagination'
import {
  SupportFormSkeleton,
  SupportThreadSkeleton,
  SupportTicketListSkeleton,
} from '@/components/support/SupportSkeleton'
import StatusBadge from '@/components/admin/StatusBadge'
import {
  PARENT_TICKET_TABS,
  SUPPORT_ALLOWED_ATTACHMENT_TYPES,
  SUPPORT_CATEGORIES,
  SUPPORT_MAX_ATTACHMENT_BYTES,
  SUPPORT_PRIORITIES,
  categoryLabel,
  priorityBadgeVariant,
  priorityLabel,
  statusBadgeVariant,
  statusLabel,
  type SupportCategory,
  type SupportPriority,
} from '@/lib/support/constants'
import {
  createSupportTicket,
  fetchParentTicketDetail,
  fetchParentTickets,
  replyToTicketAsParent,
  uploadSupportAttachment,
} from '@/lib/support/parentSupport'
import type { SupportTicketDetail, SupportTicketSummary } from '@/lib/support/types'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import { formatDateTime } from '@/lib/admin/utils'

type Tab = 'submit' | 'tickets'

export default function SupportPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('submit')
  const [statusTab, setStatusTab] = useState<string>(PARENT_TICKET_TABS[0].value)
  const [page, setPage] = useState(1)

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<SupportCategory>('technical_issue')
  const [priority, setPriority] = useState<SupportPriority>('normal')
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null)

  const [tickets, setTickets] = useState<SupportTicketSummary[]>([])
  const [ticketTotal, setTicketTotal] = useState(0)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const pageSize = 8

  const loadTickets = useCallback(async () => {
    if (!user) return
    setTicketsLoading(true)
    setTicketsError(null)
    try {
      const tabDef = PARENT_TICKET_TABS.find((t) => t.value === statusTab) ?? PARENT_TICKET_TABS[0]
      const result = await fetchParentTickets(user.id, [...tabDef.statuses], page, pageSize)
      setTickets(result.data)
      setTicketTotal(result.total)
    } catch (err) {
      setTicketsError(formatSupabaseError(err))
    } finally {
      setTicketsLoading(false)
    }
  }, [user, statusTab, page, pageSize])

  const loadDetail = useCallback(async () => {
    if (!user || !selectedId) return
    setDetailLoading(true)
    try {
      const data = await fetchParentTicketDetail(user.id, selectedId)
      setDetail(data)
    } catch (err) {
      setTicketsError(formatSupabaseError(err))
    } finally {
      setDetailLoading(false)
    }
  }, [user, selectedId])

  useEffect(() => {
    if (tab === 'tickets') void loadTickets()
  }, [tab, loadTickets])

  useEffect(() => {
    if (selectedId) void loadDetail()
    else setDetail(null)
  }, [selectedId, loadDetail])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFormError(null)

    if (!subject.trim() || !message.trim()) {
      setFormError('Subject and message are required.')
      return
    }

    if (attachment) {
      if (!SUPPORT_ALLOWED_ATTACHMENT_TYPES.includes(attachment.type)) {
        setFormError('Attachment type not allowed. Use JPG, PNG, PDF, or plain text.')
        return
      }
      if (attachment.size > SUPPORT_MAX_ATTACHMENT_BYTES) {
        setFormError('Attachment must be 5 MB or smaller.')
        return
      }
    }

    setSubmitting(true)
    try {
      let attachmentUrl: string | null = null
      if (attachment) {
        attachmentUrl = await uploadSupportAttachment(user.id, attachment)
      }

      const created = await createSupportTicket(user.id, {
        subject,
        category,
        priority,
        message,
        attachmentUrl,
      })

      setSubmittedNumber(created.ticket_number)
      setSubject('')
      setMessage('')
      setAttachment(null)
      setCategory('technical_issue')
      setPriority('normal')
    } catch (err) {
      setFormError(formatSupabaseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !selectedId || !reply.trim()) return
    setReplySending(true)
    try {
      await replyToTicketAsParent(user.id, selectedId, reply)
      setReply('')
      await loadDetail()
      await loadTickets()
    } catch (err) {
      setTicketsError(formatSupabaseError(err))
    } finally {
      setReplySending(false)
    }
  }

  const inputClass =
    'w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-teal'

  return (
    <ParentLayout active="support">
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy m-0 mb-2">
            How can we help?
          </h1>
          <p className="text-muted text-sm md:text-base m-0">
            Submit a ticket and our team will get back to you. Track replies under My Tickets.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              { id: 'submit' as const, label: 'Submit Ticket' },
              { id: 'tickets' as const, label: 'My Tickets' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setSubmittedNumber(null)
                setSelectedId(null)
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-extrabold border-2 transition-colors ${
                tab === t.id
                  ? 'bg-teal text-white border-teal'
                  : 'bg-white text-navy border-gray-200 hover:border-teal'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'submit' && (
          <div className="bg-white rounded-[20px] shadow-lg border border-gray-100 p-6 md:p-8">
            {submittedNumber ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="font-display text-xl font-bold text-navy mb-2">Ticket submitted</h2>
                <p className="text-muted mb-4">Your ticket number is</p>
                <p className="text-2xl font-extrabold text-teal tracking-wide mb-6">{submittedNumber}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedNumber(null)
                    setTab('tickets')
                  }}
                  className="bg-gold text-white rounded-full px-6 py-3 font-extrabold border-0 cursor-pointer hover:bg-gold-dark"
                >
                  View My Tickets
                </button>
              </div>
            ) : submitting ? (
              <SupportFormSkeleton />
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {formError && <ErrorMessage message={formError} />}

                <div>
                  <label className="block text-sm font-bold text-navy mb-1.5">Subject</label>
                  <input
                    className={inputClass}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your issue"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-navy mb-1.5">Category</label>
                    <select
                      className={inputClass}
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SupportCategory)}
                    >
                      {SUPPORT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy mb-1.5">Priority</label>
                    <select
                      className={inputClass}
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as SupportPriority)}
                    >
                      {SUPPORT_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-navy mb-1.5">Message</label>
                  <textarea
                    className={`${inputClass} min-h-[140px] resize-y`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail…"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-navy mb-1.5">
                    Attachment <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    type="file"
                    accept={SUPPORT_ALLOWED_ATTACHMENT_TYPES.join(',')}
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                    className="text-sm text-navy"
                  />
                  <p className="text-xs text-muted mt-1 mb-0">Max 5 MB — JPG, PNG, WebP, GIF, PDF, or TXT</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-gold text-white rounded-full px-8 py-3 font-extrabold border-0 cursor-pointer hover:bg-gold-dark disabled:opacity-50"
                >
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[20px] shadow-lg border border-gray-100 p-5 md:p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {PARENT_TICKET_TABS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setStatusTab(t.value)
                      setPage(1)
                      setSelectedId(null)
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                      statusTab === t.value
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-navy border-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {ticketsError && <ErrorMessage message={ticketsError} onRetry={() => void loadTickets()} />}

              {ticketsLoading ? (
                <SupportTicketListSkeleton />
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted text-center py-8 m-0">No tickets in this category.</p>
              ) : (
                <>
                  <ul className="space-y-3 m-0 p-0 list-none">
                    {tickets.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                            selectedId === t.id
                              ? 'border-teal bg-teal/5'
                              : 'border-gray-100 hover:border-teal/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-extrabold text-teal">{t.ticket_number}</span>
                            <StatusBadge label={statusLabel(t.status)} variant={statusBadgeVariant(t.status)} />
                          </div>
                          <p className="font-bold text-navy text-sm m-0 mb-1">{t.subject}</p>
                          <p className="text-xs text-muted m-0">
                            Created {formatDateTime(t.created_at)}
                            {t.last_reply_at && t.last_reply_at !== t.created_at && (
                              <> · Last reply {formatDateTime(t.last_reply_at)}</>
                            )}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <SupportPagination
                    page={page}
                    pageSize={pageSize}
                    total={ticketTotal}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>

            <div className="bg-white rounded-[20px] shadow-lg border border-gray-100 p-5 md:p-6">
              {!selectedId ? (
                <p className="text-sm text-muted text-center py-12 m-0">Select a ticket to view the conversation.</p>
              ) : detailLoading || !detail ? (
                <SupportThreadSkeleton />
              ) : (
                <>
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-extrabold text-teal">{detail.ticket_number}</span>
                      <StatusBadge label={statusLabel(detail.status)} variant={statusBadgeVariant(detail.status)} />
                      <StatusBadge label={priorityLabel(detail.priority)} variant={priorityBadgeVariant(detail.priority)} />
                    </div>
                    <h2 className="font-display text-lg font-bold text-navy m-0 mb-1">{detail.subject}</h2>
                    <p className="text-xs text-muted m-0">
                      {categoryLabel(detail.category)} · Opened {formatDateTime(detail.created_at)}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto mb-4 pr-1">
                    {detail.messages.map((msg) => {
                      const isParent = msg.sender_type === 'parent'
                      return (
                        <div key={msg.id} className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                              isParent
                                ? 'bg-teal text-white rounded-br-md'
                                : 'bg-gray-100 text-navy rounded-bl-md'
                            }`}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 m-0 mb-1">
                              {isParent ? 'You' : 'Yaqza Support'} · {formatDateTime(msg.created_at)}
                            </p>
                            <p className="m-0">{msg.message}</p>
                            {msg.attachment_url && (
                              <SupportAttachmentLink storagePath={msg.attachment_url} />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {detail.status !== 'closed' ? (
                    <form onSubmit={(e) => void handleReply(e)} className="space-y-3">
                      <textarea
                        className={`${inputClass} min-h-[100px]`}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a reply…"
                        required
                      />
                      <button
                        type="submit"
                        disabled={replySending}
                        className="bg-gold text-white rounded-full px-6 py-2.5 font-extrabold border-0 cursor-pointer disabled:opacity-50"
                      >
                        {replySending ? 'Sending…' : 'Send Reply'}
                      </button>
                    </form>
                  ) : (
                    <p className="text-sm text-muted m-0">This ticket is closed. Open a new ticket if you need more help.</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ParentLayout>
  )
}
