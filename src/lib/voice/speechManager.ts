export type SpeechStatus = 'stopped' | 'playing' | 'paused'

type SpeechSession = {
  id: string
  stop: () => void
}

let activeSession: SpeechSession | null = null

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  )
}

export function cancelAllSpeech(): void {
  if (typeof window === 'undefined' || !isSpeechSupported()) return
  window.speechSynthesis.cancel()
  activeSession = null
}

export function claimSpeechSession(id: string, stop: () => void): void {
  if (activeSession && activeSession.id !== id) {
    activeSession.stop()
  }
  activeSession = { id, stop }
}

export function releaseSpeechSession(id: string): void {
  if (activeSession?.id === id) {
    activeSession = null
  }
}

export function pauseSpeech(): void {
  if (!isSpeechSupported()) return
  window.speechSynthesis.pause()
}

export function resumeSpeech(): void {
  if (!isSpeechSupported()) return
  window.speechSynthesis.resume()
}

export function getSpeechPaused(): boolean {
  if (!isSpeechSupported()) return false
  return window.speechSynthesis.paused
}
