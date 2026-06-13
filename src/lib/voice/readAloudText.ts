export type ReadAloudLanguage = 'en' | 'fr' | 'ar'

const LANGUAGE_CODES: Record<ReadAloudLanguage, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-SA',
}

export function getSpeechLang(language: ReadAloudLanguage = 'en'): string {
  return LANGUAGE_CODES[language]
}

export function stripHtml(text: string): string {
  if (!text) return ''
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(text, 'text/html')
    const parsed = doc.body.textContent ?? ''
    if (parsed.trim()) {
      return parsed.replace(/\s+/g, ' ').trim()
    }
  }
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function buildReadableText(title: string | undefined, content: string): string {
  const parts: string[] = []
  if (title?.trim()) parts.push(stripHtml(title))
  if (content?.trim()) parts.push(stripHtml(content))
  return parts.join('. ')
}

export function buildArticleReadAloudBody(params: {
  content: string
  islamic_teaching?: string | null
  think_about_it?: string[] | null
  activity?: string | null
}): string {
  const parts: string[] = []

  if (params.content?.trim()) {
    parts.push(stripHtml(params.content))
  }
  if (params.islamic_teaching?.trim()) {
    parts.push(`What Islam teaches. ${stripHtml(params.islamic_teaching)}`)
  }
  if (params.think_about_it?.length) {
    const questions = params.think_about_it
      .filter((q) => q?.trim())
      .map((q, i) => `Question ${i + 1}. ${stripHtml(q)}`)
    if (questions.length > 0) {
      parts.push(`Think about it. ${questions.join('. ')}`)
    }
  }
  if (params.activity?.trim()) {
    parts.push(`Activity. ${stripHtml(params.activity)}`)
  }

  return parts.join('. ')
}

export function buildQuizQuestionText(questionText: string, options: string[]): string {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']
  const optionParts = options
    .map((text, i) => `Option ${letters[i] ?? i + 1}: ${stripHtml(text)}`)
    .join('. ')
  return `${stripHtml(questionText)}. ${optionParts}`
}
