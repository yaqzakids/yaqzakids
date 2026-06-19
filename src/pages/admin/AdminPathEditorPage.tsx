import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  addArticleToPath,
  createAdminPath,
  deleteAdminPath,
  fetchAdminPath,
  fetchBadges,
  fetchPathArticles,
  removeArticleFromPath,
  reorderPathArticles,
  searchArticles,
  updateAdminPath,
  updatePathArticleRequired,
  type AdminPathForm,
  type PathArticleItem,
} from '@/lib/admin/paths'
import { fetchAdminPillars } from '@/lib/admin/articles'
import { LEARNING_PATHS } from '@/lib/learningPaths'
import { adminBtn, adminCard, adminInput, adminTextarea } from '@/lib/admin/styles'
import { slugify } from '@/lib/admin/utils'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import type { Pillar } from '@/lib/adventure/types'

const emptyForm = (): AdminPathForm => ({
  title: '',
  slug: '',
  public_slug: '',
  description: '',
  full_description: '',
  mission_statement: '',
  icon: '',
  pillar_id: '',
  difficulty_level: 'easy',
  is_free: true,
  cover_image_url: '',
  sort_order: 0,
  badge_reward_id: null,
  status: 'published',
  is_featured: false,
  age_groups: ['explorer', 'discoverer', 'thinker'],
  certificate_enabled: false,
  certificate_title: '',
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
          public_slug: (path as { public_slug?: string }).public_slug ?? '',
          description: path.description ?? '',
          full_description: (path as { full_description?: string }).full_description ?? '',
          mission_statement: (path as { mission_statement?: string }).mission_statement ?? '',
          icon: (path as { icon?: string }).icon ?? '',
          pillar_id: path.pillar_id,
          difficulty_level: path.difficulty_level,
          is_free: path.is_free,
          cover_image_url: path.cover_image_url ?? '',
          sort_order: path.sort_order,
          badge_reward_id: path.badge_reward_id,
          status: ((path as { status?: AdminPathForm['status'] }).status ?? 'published'),
          is_featured: Boolean((path as { is_featured?: boolean }).is_featured),
          age_groups: (path as { age_groups?: string[] }).age_groups ?? ['explorer', 'discoverer', 'thinker'],
          certificate_enabled: Boolean((path as { certificate_enabled?: boolean }).certificate_enabled),
          certificate_title: (path as { certificate_title?: string }).certificate_title ?? '',
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

  const handleDeletePath = async () => {
    if (!id || isNew) return
    if (!confirm(`Delete path "${form.title}"? This cannot be undone.`)) return
    await deleteAdminPath(id)
    navigate('/admin/paths')
  }

  const previewPathSlug = form.public_slug || form.slug

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
          <div><label className="block text-sm font-semibold mb-1">Slug (adventure URL)</label><input style={adminInput} value={form.slug} onChange={(e) => setField('slug', e.target.value)} /></div>
          <div>
            <label className="block text-sm font-semibold mb-1">Public slug (/paths/…)</label>
            <select style={adminInput} value={form.public_slug} onChange={(e) => setField('public_slug', e.target.value)}>
              <option value="">None</option>
              {LEARNING_PATHS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name} ({p.slug})</option>
              ))}
            </select>
          </div>
          <div><label className="block text-sm font-semibold mb-1">Icon (emoji)</label><input style={adminInput} value={form.icon} onChange={(e) => setField('icon', e.target.value)} placeholder="🔬" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Short description</label><textarea style={adminTextarea} value={form.description} onChange={(e) => setField('description', e.target.value)} /></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Full description</label><textarea style={{ ...adminTextarea, minHeight: 100 }} value={form.full_description} onChange={(e) => setField('full_description', e.target.value)} /></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Mission statement</label><textarea style={{ ...adminTextarea, minHeight: 80 }} value={form.mission_statement} onChange={(e) => setField('mission_statement', e.target.value)} /></div>
          <div>
            <label className="block text-sm font-semibold mb-1">Pillar / category</label>
            <select style={adminInput} value={form.pillar_id} onChange={(e) => setField('pillar_id', e.target.value)}>
              <option value="">Select…</option>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Status</label>
            <select style={adminInput} value={form.status} onChange={(e) => setField('status', e.target.value as AdminPathForm['status'])}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
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
          <div><label className="block text-sm font-semibold mb-1">Display order</label><input type="number" style={adminInput} value={form.sort_order} onChange={(e) => setField('sort_order', Number(e.target.value))} /></div>
          <div><label className="block text-sm font-semibold mb-1">Cover image URL</label><input style={adminInput} value={form.cover_image_url} onChange={(e) => setField('cover_image_url', e.target.value)} />
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="" className="mt-2 rounded-lg max-h-32 object-cover border border-gray-200" />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Badge reward</label>
            <select style={adminInput} value={form.badge_reward_id ?? ''} onChange={(e) => setField('badge_reward_id', e.target.value || null)}>
              <option value="">None</option>
              {badges.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Age groups</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {(['explorer', 'discoverer', 'thinker'] as const).map((age) => (
                <label key={age} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.age_groups.includes(age)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.age_groups, age]
                        : form.age_groups.filter((a) => a !== age)
                      setField('age_groups', next)
                    }}
                  />
                  {age}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold">Options</label>
            <button type="button" style={adminBtn.secondary} onClick={() => setField('is_free', !form.is_free)}>{form.is_free ? 'Free path ✓' : 'Premium — click for Free'}</button>
            <button type="button" style={adminBtn.secondary} onClick={() => setField('is_featured', !form.is_featured)}>{form.is_featured ? 'Featured ✓' : 'Not featured'}</button>
            <button type="button" style={adminBtn.secondary} onClick={() => setField('certificate_enabled', !form.certificate_enabled)}>{form.certificate_enabled ? 'Certificate enabled ✓' : 'Certificate off'}</button>
          </div>
          <div><label className="block text-sm font-semibold mb-1">Certificate title</label><input style={adminInput} value={form.certificate_title} onChange={(e) => setField('certificate_title', e.target.value)} disabled={!form.certificate_enabled} /></div>
        </div>
        {previewPathSlug && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            <a href={`/paths/${previewPathSlug}`} target="_blank" rel="noreferrer" style={{ ...adminBtn.secondary, textDecoration: 'none' }}>Preview Public Page</a>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" style={{ ...adminBtn.primary, background: '#F5A623' }} disabled={saving} onClick={() => void handleSave()}>{saving ? 'Saving…' : 'Save Path'}</button>
          {!isNew && (
            <button type="button" style={adminBtn.danger} onClick={() => void handleDeletePath()}>Delete Path</button>
          )}
        </div>
      </div>

      {!isNew && id && (
        <div style={{ ...adminCard, marginTop: 16 }}>
          <h3 className="font-bold mb-2">Articles in Path</h3>
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
            Articles unlock in this order for children. Lesson 1 is always available; each next lesson
            unlocks after the previous lesson is completed with a quiz score of 70% or higher.
          </p>
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
                  <span className="text-sm text-gray-500 w-6" title="Unlock order">
                    #{idx + 1}
                  </span>
                  <span className="text-xs text-gray-400 w-16">Order {pa.sort_order}</span>
                  <span className="flex-1 text-sm font-medium">
                    {pa.article?.title ?? pa.article_id}
                    {pa.article?.reading_time_minutes != null && (
                      <span className="text-xs text-gray-500 ml-2">· {pa.article.reading_time_minutes} min</span>
                    )}
                  </span>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={pa.is_required !== false}
                      onChange={(e) => {
                        void updatePathArticleRequired(pa.id, e.target.checked).then(async () => {
                          if (id) setPathArticles(await fetchPathArticles(id))
                        })
                      }}
                    />
                    Required
                  </label>
                  <button type="button" style={adminBtn.danger} onClick={() => void handleRemove(pa.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
