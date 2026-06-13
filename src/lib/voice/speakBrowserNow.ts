import { chunkSpeechText } from '@/lib/voice/chunkSpeechText'
import { getSpeechLang, type ReadAloudLanguage } from '@/lib/voice/readAloudText'
import { applyPronunciationToPlainText } from '@/lib/voice/pronunciation'
import type { PronunciationEntry } from '@/lib/voice/types'
import { cancelAllSpeech, isSpeechSupported } from '@/lib/voice/speechManager'

export interface SpeakBrowserOptions {
  text: string
  language: ReadAloudLanguage
  speed: number
  voiceUri?: string
  dictionary?: PronunciationEntry[]
  onStart?: () => void
  onEnd?: () => void
  onError?: (message: string) => void
}

function pickVoice(voiceUri: string | undefined, language: ReadAloudLanguage): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis
  const voices = synth.getVoices()
  if (voices.length === 0) return null

  if (voiceUri) {
    const match = voices.find((v) => v.voiceURI === voiceUri)
    if (match) return match
  }

  const prefix = language === 'en' ? 'en' : language === 'fr' ? 'fr' : 'ar'
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
    voices[0] ??
    null
  )
}

/** Speak immediately — must be called synchronously from a user click. */
export function speakBrowserNow(options: SpeakBrowserOptions): boolean {
  if (!isSpeechSupported()) {
    options.onError?.('Read aloud is not supported in this browser.')
    return false
  }

  const raw = options.text.trim()
  if (!raw) {
    options.onError?.('There is no text to read aloud.')
    return false
  }

  const synth = window.speechSynthesis
  // Warm voice list (required on Chrome/Safari before first speak).
  synth.getVoices()

  cancelAllSpeech()

  const spokenText = applyPronunciationToPlainText(raw, options.dictionary ?? [])
  const chunks = chunkSpeechText(spokenText)
  const voice = pickVoice(options.voiceUri, options.language)

  if (!voice && synth.getVoices().length === 0) {
    options.onError?.('Browser voices are still loading. Press play again in a moment.')
    return false
  }

  let chunkIndex = 0
  let started = false

  const speakNext = () => {
    if (chunkIndex >= chunks.length) {
      options.onEnd?.()
      return
    }

    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex])
    utterance.lang = getSpeechLang(options.language)
    utterance.rate = options.speed
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      if (!started) {
        started = true
        options.onStart?.()
      }
    }

    utterance.onend = () => {
      chunkIndex += 1
      speakNext()
    }

    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') return
      options.onError?.('Browser speech failed. Try another voice in the list.')
      options.onEnd?.()
    }

    synth.speak(utterance)
  }

  speakNext()
  synth.resume()

  // Optimistic start if engine is already speaking/queued.
  if (synth.speaking || synth.pending) {
    started = true
    options.onStart?.()
  }

  return true
}

export function stopBrowserNow(): void {
  cancelAllSpeech()
}
