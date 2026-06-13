import { useCallback, useEffect, useRef, useState } from 'react'
import { chunkSpeechText } from '@/lib/voice/chunkSpeechText'
import {
  buildReadableText,
  getSpeechLang,
  type ReadAloudLanguage,
} from '@/lib/voice/readAloudText'
import { applyPronunciationToPlainText } from '@/lib/voice/pronunciation'
import type { PronunciationEntry } from '@/lib/voice/types'
import {
  cancelAllSpeech,
  claimSpeechSession,
  getSpeechPaused,
  isSpeechSupported,
  pauseSpeech,
  releaseSpeechSession,
  resumeSpeech,
} from '@/lib/voice/speechManager'

interface UseBrowserSpeechOptions {
  sessionId: string
  text: string
  language: ReadAloudLanguage
  speed: number
  voiceUri: string
  voices: SpeechSynthesisVoice[]
  dictionary: PronunciationEntry[]
  onStatusChange: (status: 'playing' | 'paused' | 'stopped') => void
}

export function useBrowserSpeechVoices(language: ReadAloudLanguage) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (!isSpeechSupported()) return

    const load = () => {
      const all = window.speechSynthesis.getVoices()
      const langPrefix = language === 'en' ? 'en' : language === 'fr' ? 'fr' : 'ar'
      const filtered = all.filter((v) => v.lang.toLowerCase().startsWith(langPrefix))
      setVoices(filtered.length > 0 ? filtered : all)
    }

    load()
    const synth = window.speechSynthesis
    synth.onvoiceschanged = load
    return () => {
      synth.onvoiceschanged = null
    }
  }, [language])

  return voices
}

function resolveVoice(
  voiceUri: string,
  voices: SpeechSynthesisVoice[],
  language: ReadAloudLanguage
): SpeechSynthesisVoice | null {
  const fromUri = voices.find((voice) => voice.voiceURI === voiceUri)
  if (fromUri) return fromUri
  if (voices[0]) return voices[0]

  const langPrefix = language === 'en' ? 'en' : language === 'fr' ? 'fr' : 'ar'
  const systemVoices = window.speechSynthesis.getVoices()
  return (
    systemVoices.find((voice) => voice.voiceURI === voiceUri) ??
    systemVoices.find((voice) => voice.lang.toLowerCase().startsWith(langPrefix)) ??
    systemVoices[0] ??
    null
  )
}

export function useBrowserSpeech({
  sessionId,
  text,
  language,
  speed,
  voiceUri,
  voices,
  dictionary,
  onStatusChange,
}: UseBrowserSpeechOptions) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const generationRef = useRef(0)

  const cancel = useCallback(() => {
    generationRef.current += 1
    cancelAllSpeech()
    utteranceRef.current = null
    releaseSpeechSession(sessionId)
  }, [sessionId])

  const stop = useCallback(() => {
    cancel()
    onStatusChange('stopped')
  }, [cancel, onStatusChange])

  const speak = useCallback((): Promise<void> => {
    if (!isSpeechSupported() || !text.trim()) {
      return Promise.reject(new Error('Browser speech is unavailable or text is empty.'))
    }

    const generation = generationRef.current + 1
    generationRef.current = generation

    cancelAllSpeech()

    const spokenText = applyPronunciationToPlainText(text, dictionary)
    const chunks = chunkSpeechText(spokenText)
    const selectedVoice = resolveVoice(voiceUri, voices, language)
    const synth = window.speechSynthesis

    return new Promise((resolve, reject) => {
      let started = false
      let finished = false

      const markStarted = () => {
        if (started || finished || generation !== generationRef.current) return
        started = true
        onStatusChange('playing')
        resolve()
      }

      const markFailed = (message: string) => {
        if (finished || generation !== generationRef.current) return
        finished = true
        window.clearInterval(pollId)
        window.clearTimeout(startTimeout)
        onStatusChange('stopped')
        releaseSpeechSession(sessionId)
        utteranceRef.current = null
        reject(new Error(message))
      }

      const markFinished = () => {
        if (finished || generation !== generationRef.current) return
        finished = true
        window.clearInterval(pollId)
        window.clearTimeout(startTimeout)
        onStatusChange('stopped')
        releaseSpeechSession(sessionId)
        utteranceRef.current = null
      }

      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk)
        utterance.lang = getSpeechLang(language)
        utterance.rate = speed
        if (selectedVoice) utterance.voice = selectedVoice

        if (index === 0) {
          utteranceRef.current = utterance
          utterance.onstart = () => markStarted()
        }

        if (index === chunks.length - 1) {
          utterance.onend = () => markFinished()
        }

        utterance.onerror = (event) => {
          if (generation !== generationRef.current) return
          if (event.error === 'interrupted' || event.error === 'canceled') return
          markFailed('Browser speech failed. Try a different browser voice.')
        }

        synth.speak(utterance)
      })

      claimSpeechSession(sessionId, stop)
      synth.resume()

      const pollId = window.setInterval(() => {
        if (generation !== generationRef.current) return
        if (synth.speaking || synth.pending) {
          markStarted()
        }
      }, 120)

      const startTimeout = window.setTimeout(() => {
        if (generation !== generationRef.current) return
        if (started || synth.speaking || synth.pending) {
          markStarted()
          return
        }
        markFailed('Browser speech did not start. Try Safari/Chrome or pick another voice.')
      }, 4000)
    })
  }, [text, language, speed, voiceUri, voices, dictionary, sessionId, stop, onStatusChange])

  const pause = useCallback(() => {
    pauseSpeech()
    onStatusChange('paused')
  }, [onStatusChange])

  const resume = useCallback(() => {
    if (getSpeechPaused()) {
      resumeSpeech()
      onStatusChange('playing')
      return true
    }
    if (window.speechSynthesis.speaking) {
      onStatusChange('playing')
      return true
    }
    return false
  }, [onStatusChange])

  useEffect(() => {
    return () => {
      generationRef.current += 1
      if (utteranceRef.current) {
        cancelAllSpeech()
        releaseSpeechSession(sessionId)
      }
    }
  }, [sessionId])

  return { speak, pause, resume, stop, cancel, isSupported: isSpeechSupported() }
}

export { buildReadableText, isSpeechSupported }
