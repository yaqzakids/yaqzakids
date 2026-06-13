export async function hashContent(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}

export async function buildTtsCacheKey(params: {
  text: string
  language: string
  voice: string
  speed: number
  articleId?: string
  ageGroup?: string
  prefix?: string
}): Promise<string> {
  const contentHash = await hashContent(
    `${params.text}:${params.language}:${params.voice}:${params.speed}`
  )

  if (params.articleId && params.ageGroup) {
    return `article:${params.articleId}:${params.ageGroup}:${params.language}:${params.voice}:${params.speed}:${contentHash}`
  }

  if (params.prefix) {
    return `${params.prefix}:${params.language}:${params.voice}:${params.speed}:${contentHash}`
  }

  return `tts:${contentHash}:${params.language}:${params.voice}:${params.speed}`
}
