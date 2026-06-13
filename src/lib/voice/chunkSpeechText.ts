/** Split long narration into chunks Chrome/Safari can reliably speak. */
export function chunkSpeechText(text: string, maxLength = 180): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  if (normalized.length <= maxLength) return [normalized]

  const chunks: string[] = []
  let remaining = normalized

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf('. ', maxLength)
    if (splitAt < maxLength * 0.35) {
      splitAt = remaining.lastIndexOf(' ', maxLength)
    }
    if (splitAt <= 0) {
      splitAt = maxLength
    }

    const chunk = remaining.slice(0, splitAt).trim()
    if (chunk) chunks.push(chunk)
    remaining = remaining.slice(splitAt).trim()
  }

  if (remaining) chunks.push(remaining)
  return chunks.length > 0 ? chunks : [normalized]
}
