import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { resolveArticleUrl } from '@/lib/discoverer'
import type { AdventureArticle } from '@/lib/adventure/types'

interface DiscovererSearchModalProps {
  open: boolean
  onClose: () => void
}

export default function DiscovererSearchModal({ open, onClose }: DiscovererSearchModalProps) {
  const [query, setQuery] = useState('')
  const [articles, setArticles] = useState<AdventureArticle[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    let cancelled = false
    supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('title')
      .then(async ({ data }) => {
        if (cancelled) return
        const list = (data ?? []) as AdventureArticle[]
        setArticles(list)
        const map: Record<string, string> = {}
        for (const a of list.slice(0, 30)) {
          const u = await resolveArticleUrl(a.id)
          if (u) map[a.id] = u
        }
        if (!cancelled) setUrls(map)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return articles.slice(0, 8)
    return articles.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 8)
  }, [articles, query])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-[#1B2F5E]/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search stories"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl" aria-hidden>🔍</span>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories…"
            className="flex-1 px-3 py-2 text-navy font-semibold focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-navy text-sm font-bold px-2"
          >
            Esc
          </button>
        </div>
        <ul className="space-y-1 max-h-72 overflow-y-auto">
          {filtered.map((a) => (
            <li key={a.id}>
              <Link
                to={urls[a.id] ?? '/discoverer/explore'}
                onClick={onClose}
                className="block px-3 py-2.5 rounded-xl hover:bg-[#EEF4FF] text-navy font-semibold text-sm"
              >
                {a.title}
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-sm text-muted text-center">No stories found.</li>
          )}
        </ul>
        <Link
          to="/discoverer/explore"
          onClick={onClose}
          className="block text-center mt-4 text-teal text-sm font-extrabold hover:underline"
        >
          Browse all stories →
        </Link>
      </div>
    </div>
  )
}
