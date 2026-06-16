import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { resolveArticleUrl } from '@/lib/discoverer'
import { LEARNING_PATH_LINKS } from '@/lib/navLinks'
import type { AdventureArticle } from '@/lib/adventure/types'

export default function NavbarSearchModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
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
        for (const a of list.slice(0, 40)) {
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

  const q = query.trim().toLowerCase()

  const filteredArticles = useMemo(() => {
    if (!q) return articles.slice(0, 6)
    return articles.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 6)
  }, [articles, q])

  const filteredPaths = useMemo(() => {
    if (!q) return LEARNING_PATH_LINKS.slice(0, 4)
    return LEARNING_PATH_LINKS.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 4)
  }, [q])

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
        aria-label="Search"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories and paths…"
            className="flex-1 px-3 py-2 text-[#1B2F5E] font-semibold focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1B2F5E] text-sm font-bold px-2"
          >
            Esc
          </button>
        </div>

        {filteredPaths.length > 0 && (
          <>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF] px-1 mb-1">
              Learning Paths
            </p>
            <ul className="space-y-1 mb-4">
              {filteredPaths.map((p) => (
                <li key={p.to}>
                  <Link
                    to={p.to}
                    onClick={onClose}
                    className="block px-3 py-2 rounded-xl hover:bg-[#F8FAFC] text-[#1B2F5E] font-semibold text-sm"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF] px-1 mb-1">
          Stories
        </p>
        <ul className="space-y-1 max-h-56 overflow-y-auto">
          {filteredArticles.map((a) => (
            <li key={a.id}>
              <Link
                to={urls[a.id] ?? '/discoverer/explore'}
                onClick={onClose}
                className="block px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] text-[#1B2F5E] font-semibold text-sm"
              >
                {a.title}
              </Link>
            </li>
          ))}
          {filteredArticles.length === 0 && (
            <li className="px-3 py-4 text-sm text-[#6B7280] text-center">No results found.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
