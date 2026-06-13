import { useState } from 'react'
import { getSignedAttachmentUrl } from '@/lib/support/parentSupport'

export default function SupportAttachmentLink({
  storagePath,
  label = 'View attachment',
}: {
  storagePath: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openAttachment = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = await getSignedAttachmentUrl(storagePath)
      if (!url) throw new Error('Could not open attachment')
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Attachment unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => void openAttachment()}
        disabled={loading}
        className="text-xs font-bold text-teal underline bg-transparent border-0 cursor-pointer p-0 disabled:opacity-50"
      >
        {loading ? 'Opening…' : `📎 ${label}`}
      </button>
      {error && <p className="text-xs text-coral mt-1 mb-0">{error}</p>}
    </div>
  )
}
