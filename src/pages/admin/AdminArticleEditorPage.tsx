import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  articleToForm,
  createAdminArticle,
  fetchAdminArticle,
  fetchAdminPillars,
  updateAdminArticle,
  type AdminArticleForm,
} from '@/lib/admin/articles'
import { emptyLocalesI18n, getLocalizedArticleFields } from '@/lib/admin/articleI18n'
import { ARTICLE_LANGUAGES } from '@/lib/admin/articleI18n'
import { adminBtn, adminCard, adminInput } from '@/lib/admin/styles'
import { slugify } from '@/lib/admin/utils'
import type { Pillar } from '@/lib/adventure/types'
import type { AdventureArticle } from '@/lib/adventure/types'
import type { AgeGroup, Language, UsulTheme } from '@/lib/types'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import ArticleQuizEditor from '@/components/admin/ArticleQuizEditor'
import ArticleContentEditor from '@/components/admin/ArticleContentEditor'
import ReadAloudPlayer from '@/components/voice/ReadAloudPlayer'
import { buildArticleReadAloudBody } from '@/lib/voice/readAloudText'

const emptyForm = (): AdminArticleForm => ({
  title: '',
  slug: '',
  pillar_id: '',
  published: false,
  cover_image_url: '',
  reading_time_minutes: 5,
  source_name: '',
  source_url: '',
  locales: emptyLocalesI18n(),
  usul_theme: '',
  quran_connection: '',
  quran_reference: '',
  hadith_connection: '',
  hadith_reference: '',
  islamic_reflection: '',
  take_action: '',
  reflection_question: '',
  think_about_it: ['', '', ''],
  fun_facts: [],
  vocabulary: [],
  quran_connection_i18n: {},
  islamic_reflection_i18n: {},
  think_about_it_i18n: {},
  take_action_i18n: {},
})

const USUL_THEMES: { value: UsulTheme; label: string }[] = [
  { value: 'tawhid', label: 'Tawhid' },
  { value: 'revelation', label: 'Revelation' },
  { value: 'purpose', label: 'Purpose' },
  { value: 'akhlaq', label: 'Akhlaq' },
  { value: 'akhirah', label: 'Akhirah' },
  { value: 'stewardship', label: 'Stewardship' },
  { value: 'justice', label: 'Justice' },
  { value: 'knowledge', label: 'Knowledge' },
]

export default function AdminArticleEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState<AdminArticleForm>(emptyForm())
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [activeLanguage, setActiveLanguage] = useState<Language>('en')
  const [activeAge, setActiveAge] = useState<AgeGroup>('explorer')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [previewAge, setPreviewAge] = useState<AgeGroup | null>(null)
  const [previewLanguage, setPreviewLanguage] = useState<Language>('en')
  const [editorTab, setEditorTab] = useState<'content' | 'faith'>('content')

  useEffect(() => {
    fetchAdminPillars().then(setPillars)
  }, [])

  useEffect(() => {
    if (isNew) return
    if (!id) return
    setLoading(true)
    fetchAdminArticle(id)
      .then((article) => setForm(articleToForm(article)))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const setField = <K extends keyof AdminArticleForm>(key: K, value: AdminArticleForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && (isNew || !prev.slug)) {
        next.slug = slugify(String(value))
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (isNew) {
        const newId = await createAdminArticle(form)
        navigate(`/admin/articles/${newId}`, { replace: true })
        setMessage('Article created.')
      } else if (id) {
        await updateAdminArticle(id, form)
        setMessage('Saved successfully.')
      }
    } catch {
      setMessage('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const previewArticle = useMemo((): AdventureArticle | null => {
    if (!previewAge) return null
    const legacy = form.locales.en
    return {
      id: id ?? 'preview',
      pillar_id: form.pillar_id,
      title: legacy?.title ?? form.title,
      slug: form.slug,
      excerpt: null,
      content: null,
      age_min: 5,
      age_max: 16,
      reading_time_minutes: form.reading_time_minutes,
      is_premium: true,
      cover_image_url: form.cover_image_url,
      published: form.published,
      content_explorer: legacy?.content_explorer ?? null,
      content_discoverer: legacy?.content_discoverer ?? null,
      content_thinker: legacy?.content_thinker ?? null,
      islamic_teaching: legacy?.islamic_teaching ?? null,
      think_about_it: legacy?.think_about_it?.filter(Boolean) ?? null,
      activity: legacy?.activity ?? null,
      source_name: form.source_name,
      source_url: form.source_url,
      locales_i18n: form.locales,
    }
  }, [form, id, previewAge])

  const previewFields = previewArticle && previewAge
    ? getLocalizedArticleFields(previewArticle, previewLanguage, previewAge)
    : null

  if (loading) return <CardSkeleton count={3} />

  return (
    <div>
      <Link to="/admin/articles" style={{ ...adminBtn.secondary, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
        ← Back to Articles
      </Link>

      <div style={{ ...adminCard, marginBottom: 16 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Slug</label>
            <input style={adminInput} value={form.slug} onChange={(e) => setField('slug', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Category (Pillar)</label>
            <select style={adminInput} value={form.pillar_id} onChange={(e) => setField('pillar_id', e.target.value)}>
              <option value="">Select pillar…</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Reading Time (minutes)</label>
            <input
              type="number"
              style={adminInput}
              value={form.reading_time_minutes}
              onChange={(e) => setField('reading_time_minutes', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Cover Image URL</label>
            <input style={adminInput} value={form.cover_image_url} onChange={(e) => setField('cover_image_url', e.target.value)} />
            {form.cover_image_url && <img src={form.cover_image_url} alt="" className="mt-2 h-24 object-cover rounded" />}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Status</label>
            <button type="button" style={adminBtn.secondary} onClick={() => setField('published', !form.published)}>
              {form.published ? 'Published — click for Draft' : 'Draft — click for Published'}
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Source Name</label>
            <input style={adminInput} value={form.source_name} onChange={(e) => setField('source_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Source URL</label>
            <input style={adminInput} value={form.source_url} onChange={(e) => setField('source_url', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ ...adminCard, marginBottom: 16 }}>
        <div className="flex gap-2 mb-4">
          {(['content', 'faith'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setEditorTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                editorTab === tab
                  ? 'bg-[#1B2F5E] text-white border-[#1B2F5E]'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {tab === 'content' ? 'Content' : 'Faith & Reflection'}
            </button>
          ))}
        </div>

        {editorTab === 'content' && (
        <ArticleContentEditor
          locales={form.locales}
          activeLanguage={activeLanguage}
          activeAge={activeAge}
          onLanguageChange={setActiveLanguage}
          onAgeChange={setActiveAge}
          onLocalesChange={(locales) => {
            setForm((prev) => {
              const enTitle = locales.en?.title ?? prev.title
              return {
                ...prev,
                locales,
                title: enTitle,
                slug: isNew || !prev.slug ? slugify(enTitle) : prev.slug,
              }
            })
          }}
        />
        )}
      </div>

      {editorTab === 'faith' && (
      <div style={{ ...adminCard, marginBottom: 16 }}>
        <h2 className="font-bold text-navy mb-4">Faith & Reflection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Usul Theme</label>
            <select
              style={adminInput}
              value={form.usul_theme}
              onChange={(e) => setField('usul_theme', e.target.value as UsulTheme | '')}
            >
              <option value="">Select theme…</option>
              {USUL_THEMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Quran Reference</label>
            <input
              style={adminInput}
              value={form.quran_reference}
              onChange={(e) => setField('quran_reference', e.target.value)}
              placeholder="Surah An-Nahl 16:68"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Quran Connection (Arabic / translation)</label>
          <textarea
            style={{ ...adminInput, minHeight: 80 }}
            dir="rtl"
            value={form.quran_connection}
            onChange={(e) => setField('quran_connection', e.target.value)}
            className="font-serif"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Hadith Connection</label>
            <textarea
              style={{ ...adminInput, minHeight: 80 }}
              value={form.hadith_connection}
              onChange={(e) => setField('hadith_connection', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Hadith Reference</label>
            <input
              style={adminInput}
              value={form.hadith_reference}
              onChange={(e) => setField('hadith_reference', e.target.value)}
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Islamic Reflection (Ages 9–12)</label>
          <div className="flex gap-1 mb-2">
            {ARTICLE_LANGUAGES.map(({ code, flag }) => (
              <button
                key={code}
                type="button"
                onClick={() => setActiveLanguage(code)}
                className={`px-2 py-1 text-xs rounded border ${activeLanguage === code ? 'bg-navy text-white' : 'bg-white'}`}
              >
                {flag}
              </button>
            ))}
          </div>
          <textarea
            style={{ ...adminInput, minHeight: 100 }}
            value={
              activeLanguage === 'en'
                ? form.islamic_reflection
                : form.islamic_reflection_i18n[activeLanguage] ?? ''
            }
            onChange={(e) => {
              if (activeLanguage === 'en') {
                setField('islamic_reflection', e.target.value)
              } else {
                setField('islamic_reflection_i18n', {
                  ...form.islamic_reflection_i18n,
                  [activeLanguage]: e.target.value,
                })
              }
            }}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Think About It (up to 3)</label>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              style={{ ...adminInput, marginBottom: 8 }}
              value={form.think_about_it[i] ?? ''}
              onChange={(e) => {
                const next = [...form.think_about_it]
                next[i] = e.target.value
                setField('think_about_it', next)
              }}
              placeholder={`Question ${i + 1}`}
            />
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Take Action</label>
          <textarea
            style={{ ...adminInput, minHeight: 80 }}
            value={form.take_action}
            onChange={(e) => setField('take_action', e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Reflection Question (open-ended)</label>
          <textarea
            style={{ ...adminInput, minHeight: 60 }}
            value={form.reflection_question}
            onChange={(e) => setField('reflection_question', e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Fun Facts (up to 5)</label>
          {form.fun_facts.map((f, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                style={{ ...adminInput, width: 60 }}
                value={f.emoji}
                onChange={(e) => {
                  const next = [...form.fun_facts]
                  next[i] = { ...next[i], emoji: e.target.value }
                  setField('fun_facts', next)
                }}
                placeholder="🐝"
              />
              <input
                style={{ ...adminInput, flex: 1 }}
                value={f.fact}
                onChange={(e) => {
                  const next = [...form.fun_facts]
                  next[i] = { ...next[i], fact: e.target.value }
                  setField('fun_facts', next)
                }}
              />
            </div>
          ))}
          {form.fun_facts.length < 5 && (
            <button
              type="button"
              style={adminBtn.secondary}
              onClick={() => setField('fun_facts', [...form.fun_facts, { emoji: '✨', fact: '' }])}
            >
              + Add fact
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Vocabulary (up to 5)</label>
          {form.vocabulary.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 mb-2">
              <input
                style={adminInput}
                value={v.word}
                placeholder="Word"
                onChange={(e) => {
                  const next = [...form.vocabulary]
                  next[i] = { ...next[i], word: e.target.value }
                  setField('vocabulary', next)
                }}
              />
              <input
                style={adminInput}
                value={v.definition}
                placeholder="Definition"
                onChange={(e) => {
                  const next = [...form.vocabulary]
                  next[i] = { ...next[i], definition: e.target.value }
                  setField('vocabulary', next)
                }}
              />
            </div>
          ))}
          {form.vocabulary.length < 5 && (
            <button
              type="button"
              style={adminBtn.secondary}
              onClick={() => setField('vocabulary', [...form.vocabulary, { word: '', definition: '' }])}
            >
              + Add word
            </button>
          )}
        </div>
      </div>
      )}

      {!isNew && id && <ArticleQuizEditor articleId={id} articleTitle={form.locales.en?.title ?? form.title} />}

      {isNew && (
        <div style={{ ...adminCard, marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Save the article first to add quiz questions.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          style={{ ...adminBtn.primary, opacity: saving ? 0.7 : 1 }}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <div className="flex gap-1">
          {ARTICLE_LANGUAGES.map(({ code, flag, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setPreviewLanguage(code)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md border cursor-pointer ${
                previewLanguage === code ? 'bg-[#1B2F5E] text-white border-[#1B2F5E]' : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {flag} {label}
            </button>
          ))}
        </div>
        <select style={{ ...adminInput, width: 'auto' }} value={previewAge ?? ''} onChange={(e) => setPreviewAge((e.target.value || null) as AgeGroup | null)}>
          <option value="">Preview as…</option>
          <option value="explorer">Explorer</option>
          <option value="discoverer">Discoverer</option>
          <option value="thinker">Thinker</option>
        </select>
        {message && <span className="text-sm text-green-700">{message}</span>}
      </div>

      {previewAge && previewFields && previewArticle && (
        <div
          style={{ ...adminCard, marginTop: 16, border: '2px solid #F5A623' }}
          dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          <h3 className="font-bold mb-2">
            Preview ({previewAge}, {previewLanguage.toUpperCase()})
          </h3>
          <ReadAloudPlayer
            label="Listen to this article"
            title={previewFields.title}
            content={buildArticleReadAloudBody({
              content: previewFields.content,
              islamic_teaching: previewFields.islamic_teaching,
              think_about_it: previewFields.think_about_it,
              activity: previewFields.activity,
            })}
            language={previewLanguage}
            articleId={id}
            ageGroup={previewAge}
            ignoreVoiceSetting
          />
          <h4 className="font-display text-xl font-bold text-navy mt-4">{previewFields.title}</h4>
          <div
            className="prose text-sm whitespace-pre-wrap mt-4"
            style={previewLanguage === 'ar' ? { fontFamily: "'Noto Naskh Arabic', 'Amiri', serif", lineHeight: 1.9 } : undefined}
          >
            {previewFields.content}
          </div>
          {previewFields.islamic_teaching && (
            <div className="mt-4">
              <strong>Islamic Teaching:</strong>
              <p className="whitespace-pre-wrap text-sm">{previewFields.islamic_teaching}</p>
            </div>
          )}
          {previewFields.think_about_it && previewFields.think_about_it.length > 0 && (
            <div className="mt-4">
              <strong>Think About It:</strong>
              <ul className="text-sm space-y-1 mt-1">
                {previewFields.think_about_it.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </div>
          )}
          {previewFields.activity && (
            <div className="mt-4">
              <strong>Activity:</strong>
              <p className="whitespace-pre-wrap text-sm">{previewFields.activity}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
