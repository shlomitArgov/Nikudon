/**
 * Audio clip manifest — maps a nikud sound-group to its playable clip URL.
 *
 * Phase 1: audio is keyed by NikudGroupId only (one clip per sound, per AUDIO-04).
 * Trial.correctGroupId has no associated letterId yet — letter selection doesn't
 * exist until Phase 3 (the letter-picker). A future Phase 3 planner will extend
 * this to a (letterId, groupId) composite key once per-letter recordings exist.
 */
import type { NikudGroupId } from './nikudGroups'

// Glob covers both formats so the placeholder->real-recording swap (wav->mp3)
// needs no code change, only a file swap.
const modules = import.meta.glob('./audio/placeholder/*.{wav,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const audioMap = new Map<string, string>()
for (const [path, url] of Object.entries(modules)) {
  const groupId = path.split('/').pop()!.replace(/\.(wav|mp3)$/, '')
  audioMap.set(groupId, url)
}

/**
 * Get the audio clip URL for a nikud sound-group.
 * Returns undefined (never throws) when no clip exists for the group — D-03 fail-soft.
 */
export function getAudioUrl(groupId: NikudGroupId): string | undefined {
  return audioMap.get(groupId)
}

/**
 * Get all nikud group IDs that currently have a playable clip.
 */
export function getKnownGroupIds(): NikudGroupId[] {
  return [...audioMap.keys()] as NikudGroupId[]
}
