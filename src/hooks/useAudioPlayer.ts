/**
 * Tap-to-hear playback hook — owns a module-level singleton AudioContext,
 * preloads/decodes all known clips on mount, and exposes a synchronous-safe
 * play(key) for the drill's play button and the Home niqqud-name buttons.
 *
 * Fail-soft by design (console.warn, never throw): unlike stageRunner.ts's
 * throw-on-invalid-input pattern (a programmer-error case), a missing or
 * failed-to-decode audio clip is a runtime content-availability case (D-03) —
 * the play button must stay tappable and the app must never crash or alert()
 * because a clip hasn't been recorded yet. Do not "fix" this to throw.
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import { getAudioUrl, getAllAudioKeys } from '../content/audioAssets'

// Module-level singleton — survives component remounts, respects Safari's
// documented cap on concurrently-open AudioContext instances.
let sharedContext: AudioContext | null = null
function getAudioContext(): AudioContext {
  if (!sharedContext) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    sharedContext = new Ctor()
  }
  return sharedContext
}

/**
 * Synchronously creates (if needed) and resumes the shared AudioContext.
 * Must be called directly inside a user gesture handler (e.g. a tap's
 * onClick), with no `await` before it, so the browser's autoplay-unlock
 * requirement (notably iOS Safari) is satisfied. Because getAudioContext()
 * lazily constructs the singleton on first call, calling this before the
 * useAudioPlayer hook has mounted both creates and unlocks the context.
 *
 * Fail-soft by design (console.warn, never throw) per D-03.
 */
export function unlockAudio(): void {
  try {
    const ctx = getAudioContext()
    void ctx.resume()
  } catch (err) {
    console.warn('[useAudioPlayer] failed to unlock AudioContext', err)
  }
}

export function useAudioPlayer() {
  const bufferCache = useRef(new Map<string, AudioBuffer>())
  const currentSource = useRef<AudioBufferSourceNode | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Background preload/decode — NOT gesture-gated, runs on mount, so the
  // very first tap of a session has a ready buffer (AUDIO-02/AUDIO-03).
  useEffect(() => {
    let cancelled = false
    const ctx = getAudioContext()

    Promise.all(
      getAllAudioKeys().map(async (key) => {
        const url = getAudioUrl(key)
        if (!url) return
        try {
          const res = await fetch(url) // resolves from Workbox precache, offline-capable
          const arrayBuffer = await res.arrayBuffer()
          const decoded = await ctx.decodeAudioData(arrayBuffer)
          if (!cancelled) bufferCache.current.set(key, decoded)
        } catch (err) {
          // D-03: fail soft — log only, never throw/alert.
          console.warn(`[useAudioPlayer] failed to preload clip for "${key}"`, err)
        }
      })
    ).then(() => {
      if (!cancelled) setIsReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const play = useCallback((key: string) => {
    const ctx = getAudioContext()
    // Synchronous, no await before this line — required for iOS unlock.
    void ctx.resume()

    const buffer = bufferCache.current.get(key)
    if (!buffer) {
      // D-03: fail soft — button stays tappable, no crash, no alert().
      console.warn(`[useAudioPlayer] no audio clip available for "${key}"`)
      return
    }

    // Stop any still-playing previous clip so rapid repeat taps sound clean,
    // not overlapping/garbled (supports AUDIO-02's "no lag on repeated taps").
    currentSource.current?.stop()

    const source = ctx.createBufferSource() // one-shot node — fresh instance per tap
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    currentSource.current = source
  }, [])

  return { play, isReady }
}
