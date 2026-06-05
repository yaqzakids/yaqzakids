import type { Article } from '../../lib/types'

interface SourceLinksProps {
  article: Article
}

export default function SourceLinks({ article }: SourceLinksProps) {
  const links = [
    { url: article.source_url, label: 'Read Original Article →' },
    { url: article.source_url_2, label: 'Further Reading 2 →' },
    { url: article.source_url_3, label: 'Further Reading 3 →' },
  ].filter((l) => l.url)

  if (!article.source && links.length === 0) return null

  return (
    <div className="border-t border-gray-200 pt-5 mt-8">
      <p className="text-muted text-xs font-extrabold uppercase mb-4">📚 Sources & Further Reading</p>
      {article.source && <p className="font-semibold text-navy mb-3">{article.source}</p>}
      <div className="space-y-2">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-teal text-sm font-bold hover:opacity-80 transition-opacity"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
