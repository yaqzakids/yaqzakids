let activeAudio: HTMLAudioElement | null = null
let activeStop: (() => void) | null = null

export function stopActiveAudio(): void {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
  if (activeStop) {
    activeStop()
    activeStop = null
  }
}

export function registerActiveAudio(audio: HTMLAudioElement, stop: () => void): void {
  stopActiveAudio()
  activeAudio = audio
  activeStop = stop
}

export function unregisterActiveAudio(audio: HTMLAudioElement): void {
  if (activeAudio === audio) {
    activeAudio = null
    activeStop = null
  }
}

export function pauseActiveAudio(): void {
  activeAudio?.pause()
}

export function resumeActiveAudio(): Promise<void> | undefined {
  return activeAudio?.play() ?? undefined
}

export function getActiveAudio(): HTMLAudioElement | null {
  return activeAudio
}
