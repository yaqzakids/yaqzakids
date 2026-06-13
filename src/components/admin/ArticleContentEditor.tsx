import type { AgeGroup, Language } from '@/lib/types'
import type { ArticleLocalesI18n } from '@/types/articleLocales'
import { adminBtn, adminInput, adminTextarea } from '@/lib/admin/styles'
import {
  ARTICLE_LANGUAGES,
  ageHasLocaleContent,
  arabicTextareaStyle,
  countLocaleCompletion,
  getLocaleBundle,
  setLocaleBundle,
} from '@/lib/admin/articleI18n'

const ageTabs: { key: AgeGroup; label: string; field: 'content_explorer' | 'content_discoverer' | 'content_thinker' }[] = [
  { key: 'explorer', label: 'Explorer', field: 'content_explorer' },
  { key: 'discoverer', label: 'Discoverer', field: 'content_discoverer' },
  { key: 'thinker', label: 'Thinker', field: 'content_thinker' },
]

interface ArticleContentEditorProps {
  locales: ArticleLocalesI18n
  activeLanguage: Language
  activeAge: AgeGroup
  onLanguageChange: (lang: Language) => void
  onAgeChange: (age: AgeGroup) => void
  onLocalesChange: (locales: ArticleLocalesI18n) => void
}

function ReferenceBlock({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div className="mb-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">{label} (EN reference)</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

function ReferenceList({ label, items }: { label: string; items: string[] }) {
  const filled = items.filter(Boolean)
  if (filled.length === 0) return null
  return (
    <div className="mb-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">{label} (EN reference)</p>
      <ul className="text-sm text-gray-700 space-y-1">
        {filled.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function ArticleContentEditor({
  locales,
  activeLanguage,
  activeAge,
  onLanguageChange,
  onAgeChange,
  onLocalesChange,
}: ArticleContentEditorProps) {
  const bundle = getLocaleBundle(locales, activeLanguage)
  const enBundle = getLocaleBundle(locales, 'en')
  const showReference = activeLanguage !== 'en'
  const isArabic = activeLanguage === 'ar'
  const activeAgeField = ageTabs.find((t) => t.key === activeAge)!.field

  const patch = (patchFields: Partial<typeof bundle>) => {
    onLocalesChange(setLocaleBundle(locales, activeLanguage, patchFields))
  }

  const textareaStyle = {
    ...adminTextarea,
    minHeight: 300,
    ...(isArabic ? arabicTextareaStyle : {}),
  }

  const readOnlyStyle = {
    ...textareaStyle,
    background: '#f9fafb',
    color: '#374151',
    cursor: 'default',
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-3">
        {ARTICLE_LANGUAGES.map(({ code, label, flag }) => {
          const { filled, total } = countLocaleCompletion(getLocaleBundle(locales, code))
          const active = activeLanguage === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => onLanguageChange(code)}
              className={`px-4 py-2 text-sm font-semibold rounded-md border-0 cursor-pointer flex items-center gap-2 ${
                active ? 'bg-[#1B2F5E] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{flag} {label}</span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  active ? 'bg-white/20 text-white' : filled === total ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {filled}/{total}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Title ({activeLanguage.toUpperCase()})</label>
        <input
          style={{ ...adminInput, ...(isArabic ? { direction: 'rtl', textAlign: 'right', ...arabicTextareaStyle } : {}) }}
          value={bundle.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
        {ageTabs.map((t) => {
          const hasContent = ageHasLocaleContent(bundle, t.key)
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onAgeChange(t.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-md border-0 cursor-pointer flex items-center gap-2 ${
                activeAge === t.key ? 'bg-[#2AAFA0] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: hasContent ? '#22c55e' : '#d1d5db' }}
                aria-hidden
              />
              {t.label}
            </button>
          )
        })}
      </div>

      <label className="block text-sm font-semibold mb-1">Content ({activeAge}, {activeLanguage.toUpperCase()})</label>
      {showReference ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">🇬🇧 English (reference)</p>
            <textarea style={readOnlyStyle} value={enBundle[activeAgeField]} readOnly dir="ltr" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">{isArabic ? '🇸🇦 Arabic' : '🇫🇷 French'} (edit)</p>
            <textarea
              style={textareaStyle}
              value={bundle[activeAgeField]}
              onChange={(e) => patch({ [activeAgeField]: e.target.value })}
              dir={isArabic ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
      ) : (
        <textarea
          style={textareaStyle}
          value={bundle[activeAgeField]}
          onChange={(e) => patch({ [activeAgeField]: e.target.value })}
          dir="ltr"
        />
      )}

      <div className="mt-4">
        <label className="block text-sm font-semibold mb-1">Islamic Teaching</label>
        {showReference && <ReferenceBlock label="Islamic Teaching" value={enBundle.islamic_teaching} />}
        <textarea
          style={{ ...adminTextarea, ...(isArabic ? arabicTextareaStyle : {}) }}
          value={bundle.islamic_teaching}
          onChange={(e) => patch({ islamic_teaching: e.target.value })}
          dir={isArabic ? 'rtl' : 'ltr'}
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold mb-1">Think About It</label>
        {showReference && <ReferenceList label="Think About It" items={enBundle.think_about_it} />}
        {bundle.think_about_it.map((q, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              style={{ ...adminInput, ...(isArabic ? arabicTextareaStyle : {}) }}
              value={q}
              dir={isArabic ? 'rtl' : 'ltr'}
              onChange={(e) => {
                const next = [...bundle.think_about_it]
                next[i] = e.target.value
                patch({ think_about_it: next })
              }}
            />
            <button
              type="button"
              style={adminBtn.danger}
              onClick={() => patch({ think_about_it: bundle.think_about_it.filter((_, j) => j !== i) })}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          style={adminBtn.secondary}
          onClick={() => patch({ think_about_it: [...bundle.think_about_it, ''] })}
        >
          + Add Question
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold mb-1">Activity</label>
        {showReference && <ReferenceBlock label="Activity" value={enBundle.activity} />}
        <textarea
          style={{ ...adminTextarea, ...(isArabic ? arabicTextareaStyle : {}) }}
          value={bundle.activity}
          onChange={(e) => patch({ activity: e.target.value })}
          dir={isArabic ? 'rtl' : 'ltr'}
        />
      </div>
    </div>
  )
}
