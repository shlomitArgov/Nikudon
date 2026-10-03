import { NikudGroupId, getNikudGroup, type NikudGrapheme } from './nikudGroups'

/**
 * Stage configuration
 * Each stage introduces a new nikud sound-group while reviewing previously learned ones
 */
export interface Stage {
  id: string
  introducedGroupId: NikudGroupId // The new sound-group being taught in this stage
  reviewGroupIds: NikudGroupId[] // Previously learned groups to mix in for spaced repetition
  miniGameType: 'hearAndTap' | 'matchTheMark' // Which mini-game format to use
}

/**
 * Ordered list of learning stages
 * Each stage builds on previous ones with spaced repetition
 */
export const stages: Stage[] = [
  {
    id: 'stage-1',
    introducedGroupId: 'a', // Patach/Kamatz — the "ah" sound
    // Level 1 drills the "ah" and "ee" sounds together, so "ee" (Hiriq, group
    // 'i') is in scope from the start. Both have recorded audio; the remaining
    // sounds do not yet, so they stay out of the reachable level.
    reviewGroupIds: ['i'], // Hiriq — the "ee" sound
    miniGameType: 'hearAndTap',
  },
  {
    id: 'stage-2',
    introducedGroupId: 'e', // סֶגּוֹל/צֵירֵי (the "e" sound)
    reviewGroupIds: ['a'], // Review "a" while learning "e"
    miniGameType: 'hearAndTap',
  },
  {
    id: 'stage-3',
    introducedGroupId: 'o', // חוֹלָם (the "o" sound)
    // "i" (Hiriq) is already taught in stage-1, so it isn't re-introduced here
    // — a separate stage for it would be redundant.
    reviewGroupIds: ['a', 'e', 'i'], // Review all previous
    miniGameType: 'hearAndTap',
  },
  {
    id: 'stage-4',
    introducedGroupId: 'u', // קֻבּוּץ/שׁוּרוּק (the "u" sound)
    reviewGroupIds: ['a', 'e', 'i', 'o'], // Review all previous
    miniGameType: 'hearAndTap',
  },
] as const

/**
 * Get a stage by its ID
 */
export function getStage(id: string): Stage | undefined {
  return stages.find((stage) => stage.id === id)
}

/**
 * Get the first stage
 */
export function getFirstStage(): Stage {
  return stages[0]
}

/**
 * All sound-groups in scope for a stage: the introduced group plus any review
 * groups, de-duplicated. Trials draw both their correct answer and their
 * distractors only from this set, so an untaught sound never appears (ENG-01).
 */
export function getStageGroupIds(stage: Stage): NikudGroupId[] {
  return Array.from(new Set([stage.introducedGroupId, ...stage.reviewGroupIds]))
}

/**
 * Every individual niqqud grapheme taught in a stage, across all its in-scope
 * sound-groups. The Home screen shows these as name-buttons the child must tap
 * (to hear each name) before entering the level.
 */
export function getStageGraphemes(stage: Stage): NikudGrapheme[] {
  return getStageGroupIds(stage).flatMap(
    (id) => getNikudGroup(id)?.graphemes ?? []
  )
}

/**
 * Get the next stage after a given stage ID
 */
export function getNextStage(currentStageId: string): Stage | undefined {
  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId)
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return undefined
  }
  return stages[currentIndex + 1]
}

/**
 * Number of correct trials required in a stage before the next stage unlocks.
 */
export const TRIALS_TO_UNLOCK_NEXT_STAGE = 20

/**
 * Whether the stage at `stageIndex` is unlocked, given the cumulative correct
 * trial count recorded per stage ID. The first stage is always unlocked;
 * every later stage requires TRIALS_TO_UNLOCK_NEXT_STAGE correct trials in the
 * immediately preceding stage.
 */
export function isStageUnlocked(
  stageIndex: number,
  correctCounts: Record<string, number>
): boolean {
  if (stageIndex <= 0) {
    return true
  }
  const previousStage = stages[stageIndex - 1]
  return (correctCounts[previousStage.id] ?? 0) >= TRIALS_TO_UNLOCK_NEXT_STAGE
}
