/**
 * Audio clip manifest — maps an audio KEY to its playable clip URL.
 *
 * Keys are clip filenames without extension. Two kinds of clip share this
 * manifest:
 *  - vowel-sound clips keyed by NikudGroupId (e.g. 'a', 'i') — the sound a
 *    niqqud makes, played in the drill.
 *  - niqqud-name clips keyed by a grapheme's audioId (e.g. 'patach', 'hiriq')
 *    — the spoken NAME of a sign, played on the Home level screen.
 *
 * Phase 1 keyed audio by NikudGroupId only; per-letter audio (a future
 * (letterId, groupId) composite key) doesn't exist yet.
 */

// Glob covers both formats so the placeholder->real-recording swap (wav->mp3)
// needs no code change, only a file swap.
const modules = import.meta.glob('./audio/placeholder/*.{wav,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const audioMap = new Map<string, string>()
for (const [path, url] of Object.entries(modules)) {
  const key = path.split('/').pop()!.replace(/\.(wav|mp3)$/, '')
  audioMap.set(key, url)
}

/**
 * Get the audio clip URL for a key (a NikudGroupId or a grapheme audioId).
 * Returns undefined (never throws) when no clip exists — D-03 fail-soft.
 */
export function getAudioUrl(key: string): string | undefined {
  return audioMap.get(key)
}

/**
 * All audio keys that currently have a playable clip (used for preloading).
 */
export function getAllAudioKeys(): string[] {
  return [...audioMap.keys()]
}
