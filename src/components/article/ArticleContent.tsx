import type { AgeGroup } from '../../lib/types'
import { getArticleField } from '../../lib/supabase'

interface ArticleContentProps {
  article: Record<string, unknown>
  ageGroup: AgeGroup
}

function ContentCard({
  label,
  content,
  borderColor,
  bgClass = 'bg-white',
}: {
  label: string
  content: string | null
  borderColor: string
  bgClass?: string
}) {
  if (!content) return null

  return (
    <div className={`rounded-xl p-6 mb-5 border-l-4 ${bgClass}`} style={{ borderLeftColor: borderColor }}>
      <p className="text-[11px] font-extrabold uppercase mb-3" style={{ color: borderColor }}>{label}</p>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  )
}

export default function ArticleContent({ article, ageGroup }: ArticleContentProps) {
  const whatsHappening = getArticleField(article, 'whats_happening', ageGroup) as string | null
  const whyItMatters = getArticleField(article, 'why_it_matters', ageGroup) as string | null
  const history = getArticleField(article, 'history_context', ageGroup) as string | null
  const islamic = getArticleField(article, 'islamic_teaching', ageGroup) as string | null
  const thinkAbout = getArticleField(article, 'think_about_it', ageGroup) as string[] | null
  const activity = getArticleField(article, 'activity', ageGroup) as string | null

  return (
    <div>
      <ContentCard label="🌍 WHAT'S HAPPENING" content={whatsHappening} borderColor="#2AAFA0" />
      <ContentCard label="💡 WHY IT MATTERS" content={whyItMatters} borderColor="#F5A623" />
      <ContentCard label="🏛️ A LITTLE HISTORY" content={history} borderColor="#8B6BB1" />
      <ContentCard label="☪️ WHAT ISLAM TEACHES" content={islamic} borderColor="#2AAFA0" bgClass="bg-[#F0FBF5]" />

      {thinkAbout && thinkAbout.length > 0 && (
        <div className="rounded-xl p-6 mb-5 border-l-4 border-gold bg-[#FFFBF0]" style={{ borderLeftColor: '#F5A623' }}>
          <p className="text-gold text-[11px] font-extrabold uppercase mb-3">🤔 THINK ABOUT IT</p>
          <ul className="space-y-2">
            {thinkAbout.map((q, i) => (
              <li key={i} className="text-gray-700 flex items-start gap-2">
                <span className="text-gold font-bold">•</span> {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ContentCard label="🎨 ACTIVITY CORNER" content={activity} borderColor="#8B6BB1" bgClass="bg-[#F5F3FF]" />
    </div>
  )
}
