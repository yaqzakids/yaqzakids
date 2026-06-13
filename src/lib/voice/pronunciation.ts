import type { PronunciationEntry } from '@/lib/voice/types'

export function parsePronunciationDictionary(raw: string | undefined): PronunciationEntry[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry) => entry?.term && entry?.alias)
      .map((entry) => ({ term: String(entry.term), alias: String(entry.alias) }))
  } catch {
    return []
  }
}

export function applyPronunciationToPlainText(text: string, entries: PronunciationEntry[]): string {
  let result = text
  const sorted = [...entries].sort((a, b) => b.term.length - a.term.length)

  for (const entry of sorted) {
    const escapedTerm = entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escapedTerm, 'gi'), entry.alias)
  }

  return result
}

export function serializePronunciationDictionary(entries: PronunciationEntry[]): string {
  return JSON.stringify(entries, null, 2)
}

export const DEFAULT_PRONUNCIATION_ENTRIES: PronunciationEntry[] = [
  { term: 'Salman al-Farsi', alias: 'Salman al Far-see' },
  { term: 'Abu Bakr', alias: 'Abu Bakr' },
  { term: 'Khadijah', alias: 'Khadija' },
  { term: "Qur'an", alias: 'Koran' },
  { term: 'Qur’an', alias: 'Koran' },
  { term: 'Hadith', alias: 'Ha-deeth' },
  { term: 'ﷺ', alias: 'peace be upon him' },
  { term: 'SAW', alias: 'peace be upon him' },
]
