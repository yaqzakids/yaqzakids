import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useVoiceSettings } from '@/context/VoiceSettingsContext'
import { getVoicesForLanguage } from '@/lib/voice/azureVoices'
import {
  ElevenLabsRequestError,
  isElevenLabsAvailable,
  synthesizeElevenLabsLong,
} from '@/lib/voice/elevenLabsClient'
import {
  getDefaultElevenLabsVoiceForLanguage,
  getElevenLabsVoicesForLanguage,
  isElevenLabsLibraryVoiceError,
} from '@/lib/voice/elevenLabsVoices'
import { useElevenLabsVoiceCatalog } from '@/lib/voice/useElevenLabsVoiceCatalog'
import {
  pauseActiveAudio,
  registerActiveAudio,
  resumeActiveAudio,
  stopActiveAudio,
  unregisterActiveAudio,
} from '@/lib/voice/audioManager'
import { buildTtsCacheKey } from '@/lib/voice/contentHash'
import {
  clearAzureUnavailableMark,
  isAzureMarkedUnavailable,
  markAzureUnavailable,
  probeAzureTtsAvailability,
} from '@/lib/voice/probeAzureTts'
import { applyPronunciationToPlainText } from '@/lib/voice/pronunciation'
import { cloudVoiceMatchesProvider, resolveCloudVoice } from '@/lib/voice/resolveCloudVoice'
import { buildReadableText, useBrowserSpeechVoices } from '@/lib/voice/useBrowserSpeech'
import { speakBrowserNow, stopBrowserNow } from '@/lib/voice/speakBrowserNow'
import { synthesizeSpeech, TtsRequestError } from '@/lib/voice/ttsClient'
import { clearCachedTtsAudio, getCachedTtsAudio, setCachedTtsAudio } from '@/lib/voice/ttsCache'
import { getSpeechPaused, isSpeechSupported, pauseSpeech, resumeSpeech } from '@/lib/voice/speechManager'
import type { PlaybackStatus, ReadAloudLanguage } from '@/lib/voice/types'

const SPEEDS = [0.75, 1, 1.25] as const
type SpeechSpeed = (typeof SPEEDS)[number]

export interface ReadAloudPlayerProps {
  title?: string
  content: string
  language?: ReadAloudLanguage
  label?: string
  autoRead?: boolean
  variant?: 'default' | 'compact'
  ignoreVoiceSetting?: boolean
  articleId?: string
  ageGroup?: string
  cacheKeyPrefix?: string
}

function statusLabel(status: PlaybackStatus): string {
  if (status === 'loading') return 'Loading'
  if (status === 'playing') return 'Playing'
  if (status === 'paused') return 'Paused'
  return 'Stopped'
}

const controlBtn =
  'inline-flex items-center justify-center rounded-full border-2 font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export default function ReadAloudPlayer({
  title,
  content,
  language = 'en',
  label = 'Listen',
  autoRead: _autoRead = false,
  variant = 'default',
  ignoreVoiceSetting = false,
  articleId,
  ageGroup,
  cacheKeyPrefix,
}: ReadAloudPlayerProps) {
  const sessionId = useId()
  const { settings, loading: settingsLoading } = useVoiceSettings()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const modeRef = useRef<'cloud' | 'browser' | null>(null)
  const playbackTokenRef = useRef(0)

  const [status, setStatus] = useState<PlaybackStatus>('stopped')
  const [speed, setSpeed] = useState<SpeechSpeed>(1)
  const [selectedVoice, setSelectedVoice] = useState('')
  const [providerNotice, setProviderNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [azureReady, setAzureReady] = useState<boolean | null>(null)
  const [preferBrowser, setPreferBrowser] = useState(false)

  const elevenLabsAvailable = isElevenLabsAvailable()
  const {
    voices: elevenLabsCatalog,
    loading: elevenLabsCatalogLoading,
    error: elevenLabsCatalogError,
    refresh: refreshElevenLabsCatalog,
  } = useElevenLabsVoiceCatalog(elevenLabsAvailable)
  const azureVoices = useMemo(() => getVoicesForLanguage(language), [language])
  const elevenLabsVoices = useMemo(
    () => getElevenLabsVoicesForLanguage(elevenLabsCatalog, language),
    [elevenLabsCatalog, language]
  )
  const browserVoices = useBrowserSpeechVoices(language)
  const [browserVoiceUri, setBrowserVoiceUri] = useState('')

  const readableText = useMemo(() => buildReadableText(title, content), [title, content])
  const hasText = readableText.length > 0

  const activeCloudProvider = useMemo((): 'azure' | 'elevenlabs' | null => {
    if (preferBrowser || settings.voiceProvider === 'browser') return null
    if (settings.voiceProvider === 'elevenlabs' && elevenLabsAvailable && elevenLabsCatalog.length > 0) {
      return 'elevenlabs'
    }
    if (
      settings.voiceProvider === 'azure' &&
      azureReady === true &&
      !isAzureMarkedUnavailable()
    ) {
      return 'azure'
    }
    if (elevenLabsAvailable && elevenLabsCatalog.length > 0) return 'elevenlabs'
    if (azureReady === true && !isAzureMarkedUnavailable()) return 'azure'
    return null
  }, [
    settings.voiceProvider,
    preferBrowser,
    elevenLabsAvailable,
    elevenLabsCatalog.length,
    azureReady,
  ])

  useEffect(() => {
    if (settings.speakingSpeed && SPEEDS.includes(settings.speakingSpeed as SpeechSpeed)) {
      setSpeed(settings.speakingSpeed as SpeechSpeed)
    }
  }, [settings.speakingSpeed])

  useEffect(() => {
    if (activeCloudProvider === 'elevenlabs') {
      if (
        !selectedVoice ||
        !cloudVoiceMatchesProvider(selectedVoice, 'elevenlabs', language, elevenLabsCatalog)
      ) {
        setSelectedVoice(
          resolveCloudVoice('elevenlabs', language, settings, selectedVoice, elevenLabsCatalog)
        )
      }
      return
    }

    if (activeCloudProvider === 'azure') {
      if (!selectedVoice || !cloudVoiceMatchesProvider(selectedVoice, 'azure', language)) {
        setSelectedVoice(resolveCloudVoice('azure', language, settings, selectedVoice))
      }
    }
  }, [language, settings, selectedVoice, activeCloudProvider, elevenLabsCatalog])

  useEffect(() => {
    if (browserVoices.length > 0 && !browserVoiceUri) {
      setBrowserVoiceUri(browserVoices[0].voiceURI)
    }
  }, [browserVoices, browserVoiceUri])

  useEffect(() => {
    if (settings.voiceProvider !== 'azure' && !elevenLabsAvailable) {
      setAzureReady(false)
      return
    }
    if (isAzureMarkedUnavailable()) {
      setAzureReady(false)
      return
    }
    let cancelled = false
    probeAzureTtsAvailability()
      .then((ready) => {
        if (!cancelled) setAzureReady(ready)
      })
      .catch(() => {
        if (!cancelled) setAzureReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [settings.voiceProvider, elevenLabsAvailable])

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  const clearCloudAudio = useCallback(
    (updateStatus = false) => {
      if (audioRef.current) {
        unregisterActiveAudio(audioRef.current)
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
      revokeBlobUrl()
      if (updateStatus) setStatus('stopped')
    },
    [revokeBlobUrl]
  )

  const stopAll = useCallback(() => {
    playbackTokenRef.current += 1
    stopActiveAudio()
    stopBrowserNow()
    clearCloudAudio(true)
    modeRef.current = null
    setStatus('stopped')
  }, [clearCloudAudio])

  const startBrowser = useCallback(() => {
    setErrorMessage(null)
    setProviderNotice(null)
    clearCloudAudio(false)
    stopBrowserNow()
    modeRef.current = 'browser'
    setPreferBrowser(true)

    const ok = speakBrowserNow({
      text: readableText,
      language,
      speed,
      voiceUri: browserVoiceUri,
      dictionary: settings.pronunciationDictionary,
      onStart: () => setStatus('playing'),
      onEnd: () => {
        modeRef.current = null
        setStatus('stopped')
      },
      onError: (message) => {
        modeRef.current = null
        setStatus('stopped')
        setErrorMessage(message)
      },
    })

    if (!ok) {
      modeRef.current = null
      setStatus('stopped')
    }
  }, [
    readableText,
    language,
    speed,
    browserVoiceUri,
    settings.pronunciationDictionary,
    clearCloudAudio,
  ])

  const playCloudAudio = useCallback(
    (blob: Blob, cacheKey?: string, playbackToken?: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        stopBrowserNow()
        clearCloudAudio(false)

        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        const audio = new Audio(url)
        audioRef.current = audio
        modeRef.current = 'cloud'

        audio.onplay = () => setStatus('playing')
        audio.onpause = () => {
          if (audio.currentTime > 0 && audio.currentTime < audio.duration) {
            setStatus('paused')
          }
        }
        audio.onended = () => {
          if (playbackToken !== undefined && playbackToken !== playbackTokenRef.current) {
            resolve()
            return
          }
          modeRef.current = null
          clearCloudAudio(true)
          resolve()
        }
        audio.onerror = () => {
          if (cacheKey) void clearCachedTtsAudio(cacheKey)
          modeRef.current = null
          setErrorMessage('Could not play narration audio.')
          clearCloudAudio(true)
          reject(new Error('Could not play narration audio.'))
        }

        registerActiveAudio(audio, () => {
          modeRef.current = null
          clearCloudAudio(true)
          resolve()
        })

        void audio.play().catch(reject)
      })
    },
    [clearCloudAudio]
  )

  const loadAzureAudio = useCallback(async () => {
    const voice = resolveCloudVoice('azure', language, settings, selectedVoice)
    const cacheKey = await buildTtsCacheKey({
      text: readableText,
      language,
      voice,
      speed,
      articleId,
      ageGroup,
      prefix: cacheKeyPrefix,
    })

    const cached = await getCachedTtsAudio(cacheKey)
    if (cached) {
      try {
        await playCloudAudio(cached, cacheKey)
        return
      } catch {
        await clearCachedTtsAudio(cacheKey)
      }
    }

    const blob = await synthesizeSpeech({
      text: readableText,
      language,
      voice,
      speed,
      cacheKey,
      articleId,
      ageGroup,
    })

    await setCachedTtsAudio(cacheKey, blob)
    await playCloudAudio(blob, cacheKey)
  }, [
    selectedVoice,
    settings,
    readableText,
    language,
    speed,
    articleId,
    ageGroup,
    cacheKeyPrefix,
    playCloudAudio,
  ])

  const loadElevenLabsAudio = useCallback(async () => {
    let catalog = elevenLabsCatalog
    if (catalog.length === 0) {
      catalog = await refreshElevenLabsCatalog(true)
    }
    if (catalog.length === 0) {
      throw new ElevenLabsRequestError(
        elevenLabsCatalogError ??
          'No default ElevenLabs voices found. Free plans cannot use library voices via the API.'
      )
    }

    let voice = resolveCloudVoice('elevenlabs', language, settings, selectedVoice, catalog)
    const preparedText = applyPronunciationToPlainText(
      readableText,
      settings.pronunciationDictionary
    )
    const playbackToken = playbackTokenRef.current

    const playVoice = async (voiceId: string) => {
      const cacheKey = await buildTtsCacheKey({
        text: preparedText,
        language,
        voice: `el:${voiceId}`,
        speed,
        articleId,
        ageGroup,
        prefix: cacheKeyPrefix,
      })

      const cached = await getCachedTtsAudio(cacheKey)
      if (cached) {
        try {
          await playCloudAudio(cached, cacheKey, playbackToken)
          return
        } catch {
          await clearCachedTtsAudio(cacheKey)
        }
      }

      const blobs = await synthesizeElevenLabsLong({
        text: preparedText,
        voiceId,
        language,
        speed,
      })

      if (blobs.length === 1) {
        await setCachedTtsAudio(cacheKey, blobs[0])
      }

      for (const blob of blobs) {
        if (playbackToken !== playbackTokenRef.current) return
        await playCloudAudio(blob, blobs.length === 1 ? cacheKey : undefined, playbackToken)
      }
    }

    try {
      await playVoice(voice)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (error instanceof ElevenLabsRequestError && isElevenLabsLibraryVoiceError(message)) {
        const fallbackVoice = getDefaultElevenLabsVoiceForLanguage(catalog, language)
        if (fallbackVoice && fallbackVoice !== voice) {
          voice = fallbackVoice
          setSelectedVoice(fallbackVoice)
          setProviderNotice(
            'Switched to a default ElevenLabs voice. Library voices require a paid ElevenLabs plan.'
          )
          await playVoice(fallbackVoice)
          return
        }
      }
      throw error
    }
  }, [
    elevenLabsCatalog,
    refreshElevenLabsCatalog,
    elevenLabsCatalogError,
    selectedVoice,
    settings,
    readableText,
    language,
    speed,
    articleId,
    ageGroup,
    cacheKeyPrefix,
    playCloudAudio,
  ])

  const startCloudPlayback = useCallback(() => {
    if (activeCloudProvider === 'elevenlabs') {
      setStatus('loading')
      void loadElevenLabsAudio().catch((error) => {
        setStatus('stopped')
        if (elevenLabsAvailable && activeCloudProvider === 'elevenlabs') {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load ElevenLabs narration.'
          )
        }
        if (
          settings.voiceProvider === 'azure' &&
          azureReady === true &&
          !isAzureMarkedUnavailable()
        ) {
          setProviderNotice('ElevenLabs unavailable. Trying Azure voice…')
          setStatus('loading')
          void loadAzureAudio().catch((azureError) => {
            markAzureUnavailable()
            setAzureReady(false)
            setPreferBrowser(true)
            setStatus('stopped')
            setProviderNotice('Cloud voice unavailable. Using browser voice — press play again.')
            if (!(azureError instanceof TtsRequestError) || azureError.fallback !== 'browser') {
              setErrorMessage(
                azureError instanceof Error ? azureError.message : 'Could not load narration.'
              )
            }
          })
          return
        }
        setPreferBrowser(true)
        setProviderNotice('Cloud voice unavailable. Using browser voice — press play again.')
      })
      return
    }

    if (activeCloudProvider === 'azure') {
      setStatus('loading')
      void loadAzureAudio().catch((error) => {
        markAzureUnavailable()
        setAzureReady(false)
        if (elevenLabsAvailable) {
          setProviderNotice('Azure unavailable. Trying ElevenLabs…')
          setStatus('loading')
          void loadElevenLabsAudio().catch((elevenError) => {
            setPreferBrowser(true)
            setStatus('stopped')
            setProviderNotice('Cloud voice unavailable. Using browser voice — press play again.')
            setErrorMessage(
              elevenError instanceof ElevenLabsRequestError
                ? elevenError.message
                : elevenError instanceof Error
                  ? elevenError.message
                  : 'Could not load narration.'
            )
          })
          return
        }
        setPreferBrowser(true)
        setStatus('stopped')
        setProviderNotice('Premium voice unavailable. Using browser voice — press play again.')
        if (!(error instanceof TtsRequestError) || error.fallback !== 'browser') {
          setErrorMessage(error instanceof Error ? error.message : 'Could not load narration.')
        }
      })
    }
  }, [
    activeCloudProvider,
    loadElevenLabsAudio,
    loadAzureAudio,
    elevenLabsAvailable,
    settings.voiceProvider,
    azureReady,
  ])

  const handlePlayClick = () => {
    setErrorMessage(null)

    if (status === 'paused') {
      if (modeRef.current === 'cloud' && audioRef.current) {
        void resumeActiveAudio()?.then(() => setStatus('playing'))
        return
      }
      if (modeRef.current === 'browser' && getSpeechPaused()) {
        resumeSpeech()
        setStatus('playing')
        return
      }
    }

    if (activeCloudProvider) {
      startCloudPlayback()
      return
    }

    startBrowser()
  }

  const handlePauseClick = () => {
    if (status !== 'playing') return
    if (modeRef.current === 'cloud' && audioRef.current) {
      pauseActiveAudio()
      setStatus('paused')
      return
    }
    if (modeRef.current === 'browser') {
      pauseSpeech()
      setStatus('paused')
    }
  }

  const handleRestartClick = () => {
    stopAll()
    if (activeCloudProvider) {
      startCloudPlayback()
      return
    }
    startBrowser()
  }

  useEffect(() => {
    return () => {
      playbackTokenRef.current += 1
      stopActiveAudio()
      stopBrowserNow()
      if (audioRef.current) {
        unregisterActiveAudio(audioRef.current)
        audioRef.current.pause()
      }
      revokeBlobUrl()
    }
  }, [revokeBlobUrl])

  if (!ignoreVoiceSetting && !settingsLoading && !settings.voiceEnabled) {
    return null
  }

  if (!hasText) return null

  const isCompact = variant === 'compact'
  const showCloudControls = activeCloudProvider !== null
  const showBrowserVoiceSelect =
    preferBrowser || settings.voiceProvider === 'browser' || activeCloudProvider === null

  const playBtnClass = `${controlBtn} bg-gold border-gold text-white hover:bg-gold-dark hover:border-gold-dark ${
    isCompact ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base'
  }`

  const secondaryBtnClass = `${controlBtn} bg-white border-teal text-navy hover:bg-teal/10 ${
    isCompact ? 'h-9 w-9 text-xs' : 'h-10 w-10 text-sm'
  }`

  const cloudVoiceOptions =
    activeCloudProvider === 'elevenlabs' ? elevenLabsVoices : azureVoices

  return (
    <div
      className={
        isCompact
          ? 'flex flex-wrap items-center gap-2'
          : 'rounded-2xl border-2 border-teal/30 bg-white p-4 shadow-sm'
      }
      role="region"
      aria-label={label}
    >
      {!isCompact && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm font-extrabold text-navy m-0">{label}</p>
          <span
            className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-teal/10 text-teal"
            role="status"
            aria-live="polite"
          >
            {statusLabel(status)}
          </span>
        </div>
      )}

      <div className={`flex flex-wrap items-center gap-2 ${isCompact ? '' : 'mb-3'}`}>
        {isCompact && (
          <span className="text-xs font-extrabold text-navy shrink-0">{label}</span>
        )}
        {status !== 'playing' ? (
          <button
            type="button"
            className={playBtnClass}
            onClick={handlePlayClick}
            disabled={status === 'loading' || (activeCloudProvider === 'elevenlabs' && elevenLabsCatalogLoading)}
            aria-label={status === 'paused' ? 'Resume reading' : 'Play reading'}
          >
            {status === 'loading' ? '…' : '▶'}
          </button>
        ) : (
          <button
            type="button"
            className={playBtnClass}
            onClick={handlePauseClick}
            aria-label="Pause reading"
          >
            ❚❚
          </button>
        )}
        <button
          type="button"
          className={secondaryBtnClass}
          onClick={stopAll}
          disabled={status === 'stopped' || status === 'loading'}
          aria-label="Stop reading"
        >
          ■
        </button>
        <button
          type="button"
          className={secondaryBtnClass}
          onClick={handleRestartClick}
          disabled={status === 'loading'}
          aria-label="Restart reading"
        >
          ↺
        </button>
        {isCompact && (
          <span className="text-xs font-bold text-teal" role="status" aria-live="polite">
            {statusLabel(status)}
          </span>
        )}
      </div>

      {!isCompact && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold text-navy">Speed</span>
            {SPEEDS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setSpeed(rate)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${
                  speed === rate
                    ? 'bg-teal text-white border-teal'
                    : 'bg-white text-navy border-gray-200 hover:border-teal'
                }`}
                aria-pressed={speed === rate}
                aria-label={`Reading speed ${rate}x`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {showCloudControls && cloudVoiceOptions.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <label htmlFor={`voice-${sessionId}`} className="text-xs font-bold text-navy shrink-0">
                {activeCloudProvider === 'elevenlabs' ? 'ElevenLabs Voice' : 'Premium Voice'}
              </label>
              <select
                id={`voice-${sessionId}`}
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full sm:flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-navy font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:border-teal"
                aria-label="Select reading voice"
              >
                {cloudVoiceOptions.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showBrowserVoiceSelect && isSpeechSupported() && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor={`browser-voice-${sessionId}`} className="text-xs font-bold text-navy shrink-0">
                Browser Voice
              </label>
              <select
                id={`browser-voice-${sessionId}`}
                value={browserVoiceUri}
                onChange={(e) => setBrowserVoiceUri(e.target.value)}
                className="w-full sm:flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-navy font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:border-teal"
                aria-label="Select browser reading voice"
              >
                {(browserVoices.length > 0
                  ? browserVoices
                  : window.speechSynthesis.getVoices()
                ).map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {providerNotice && (
        <div className="mt-2">
          <p className="text-xs text-muted mb-2" role="status">
            {providerNotice}
          </p>
          <button
            type="button"
            className="text-xs font-bold text-teal underline bg-transparent border-0 cursor-pointer p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded"
            onClick={() => {
              clearAzureUnavailableMark()
              setPreferBrowser(false)
              setProviderNotice(null)
              setAzureReady(null)
              void probeAzureTtsAvailability().then(setAzureReady)
            }}
          >
            Retry cloud voice
          </button>
        </div>
      )}

      {elevenLabsCatalogError && activeCloudProvider === 'elevenlabs' && (
        <p className="text-xs text-muted mt-2 mb-0" role="status">
          {elevenLabsCatalogError}
        </p>
      )}

      {errorMessage && (
        <p className="text-sm text-coral mt-2 mb-0" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
