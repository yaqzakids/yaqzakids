import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  addArticleToPath,
  createAdminPath,
  fetchAdminPath,
  fetchBadges,
  fetchPathArticles,
  removeArticleFromPath,
  reorderPathArticles,
  searchArticles,
  updateAdminPath,
  type AdminPathForm,
  type PathArticleItem,
} from '@/lib/admin/paths'
import { fetchAdminPillars } from '@/lib/admin/articles'
import { adminBtn, adminCard, adminInput, adminTextarea } from '@/lib/admin/styles'
import { slugify } from '@/lib/admin/utils'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import type { Pillar } from '@/lib/adventure/types'

const emptyForm = (): AdminPathForm => ({
  title: '',
  slug: '',
  description: '',
  pillar_id: '',
  difficulty_level: 'easy',
  is_free: true,
  cover_image_url: '',
  sort_order: 0,
  badge_reward_id: null,
})

export default function AdminPathEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState<AdminPathForm>(emptyForm())
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [badges, setBadges] = useState<{ id: string; name: string }[]>([])
  const [pathArticles, setPathArticles] = useState<PathArticleItem[]>([])
  const [articleSearch, setArticleSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([fetchAdminPillars(), fetchBadges()]).then(([p, b]) => {
      setPillars(p)
      setBadges(b)
    })
  }, [])

  useEffect(() => {
    if (isNew || !id) return
    setLoading(true)
    Promise.all([fetchAdminPath(id), fetchPathArticles(id)])
      .then(([path, articles]) => {
        setForm({
          title: path.title,
          slug: path.slug,
          description: path.description ?? '',
          pillar_id: path.pillar_id,
          difficulty_level: path.difficulty_level,
          is_free: path.is_free,
          cover_image_url: path.cover_image_url ?? '',
          sort_order: path.sort_order,
          badge_reward_id: path.badge_reward_id,
        })
        setPathArticles(articles)
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  useEffect(() => {
    if (articleSearch.length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => searchArticles(articleSearch).then(setSearchResults), 300)
    return () => clearTimeout(t)
  }, [articleSearch])

  const setField = <K extends keyof AdminPathForm>(key: K, value: AdminPathForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && (isNew || !prev.slug)) next.slug = slugify(String(value))
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isNew) {
        const newId = await createAdminPath(form)
        navigate(`/admin/paths/${newId}`, { replace: true })
      } else if (id) {
        await updateAdminPath(id, form)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddArticle = async (articleId: string) => {
    if (!id || isNew) return
    await addArticleToPath(id, articleId)
    setPathArticles(await fetchPathArticles(id))
    setArticleSearch('')
    setSearchResults([])
  }

  const handleRemove = async (pathArticleId: string) => {
    if (!id) return
    await removeArticleFromPath(pathArticleId, id)
    setPathArticles(await fetchPathArticles(id))
  }

  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx || !id) return
    const items = [...pathArticles]
    const [moved] = items.splice(dragIdx, 1)
    items.splice(targetIdx, 0, moved)
    const reordered = items.map((item, i) => ({ id: item.id, sort_order: i }))
    setPathArticles(items.map((item, i) => ({ ...item, sort_order: i })))
    await reorderPathArticles(reordered)
    setDragIdx(null)
  }

  if (loading) return <CardSkeleton count={2} />

  return (
    <div>
      <Link to="/admin/paths" style={{ ...adminBtn.secondary, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Back to Paths</Link>

      <div style={adminCard}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold mb-1">Title</label><input style={adminInput} value={form.title} onChange={(e) => setField('title', e.target.value)} /></div>
          <div><label className="block text-sm font-semibold mb-1">Slug</label><input style={adminInput} value={form.slug} onChange={(e) => setField('slug', e.target.value)} /></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Description</label><textarea style={adminTextarea} value={form.description} onChange={(e) => setField('description', e.target.value)} /></div>
          <div>
            <label className="block text-sm font-semibold mb-1">Pillar</label>
            <select style={adminInput} value={form.pillar_id} onChange={(e) => setField('pillar_id', e.target.value)}>
              <option value="">Select…</option>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Difficulty</label>
            <select style={adminInput} value={form.difficulty_level} onChange={(e) => setField('difficulty_level', e.target.value as AdminPathForm['difficulty_level'])}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div><label className="block text-sm font-semibold mb-1">Sort Order</label><input type="number" style={adminInput} value={form.sort_order} onChange={(e) => setField('sort_order', Number(e.target.value))} /></div>
          <div><label className="block text-sm font-semibold mb-1">Cover Image URL</label><input style={adminInput} value={form.cover_image_url} onChange={(e) => setField('cover_image_url', e.target.value)} /></div>
          <div>
            <label className="block text-sm font-semibold mb-1">Badge Reward</label>
            <select style={adminInput} value={form.badge_reward_id ?? ''} onChange={(e) => setField('badge_reward_id', e.target.value || null)}>
              <option value="">None</option>
              {badges.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Free Path</label>
            <button type="button" style={adminBtn.secondary} onClick={() => setField('is_free', !form.is_free)}>{form.is_free ? 'Free ✓' : 'Paid — click for Free'}</button>
          </div>
        </div>
        <button type="button" style={{ ...adminBtn.primary, marginTop: 16 }} disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : 'Save Path'}</button>
      </div>

      {!isNew && id && (
        <div style={{ ...adminCard, marginTop: 16 }}>
          <h3 className="font-bold mb-4">Articles in Path</h3>
          <div className="mb-4 relative">
            <input style={adminInput} placeholder="Search articles to add…" value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} />
            {searchResults.length > 0 && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg w-full mt-1 max-h-48 overflow-auto">
                {searchResults.map((a) => (
                  <button key={a.id} type="button" className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-0 bg-transparent cursor-pointer" onClick={() => handleAddArticle(a.id)}>
                    {a.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {pathArticles.length === 0 ? (
            <p className="text-gray-500 text-sm">No articles in this path yet.</p>
          ) : (
            <ul className="space-y-2">
              {pathArticles.map((pa, idx) => (
                <li
                  key={pa.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(idx)}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200"
                >
                  <span className="cursor-grab text-gray-400">⠿</span>
                  <span className="text-sm text-gray-500 w-6">{idx + 1}</span>
                  <span className="flex-1 text-sm font-medium">{pa.article?.title ?? pa.article_id}</span>
                  <button type="button" style={adminBtn.danger} onClick={() => handleRemove(pa.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
