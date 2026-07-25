import { NikudGroupId } from './nikudGroups'

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
    introducedGroupId: 'a', // פַּתַח/קָמַץ (the "a" sound)
    reviewGroupIds: [], // First stage, no review
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
    introducedGroupId: 'i', // חִירִיק (the "i" sound)
    reviewGroupIds: ['a', 'e'], // Review both "a" and "e"
    miniGameType: 'hearAndTap',
  },
  {
    id: 'stage-4',
    introducedGroupId: 'o', // חוֹלָם (the "o" sound)
    reviewGroupIds: ['a', 'e', 'i'], // Review all previous
    miniGameType: 'hearAndTap',
  },
  {
    id: 'stage-5',
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
 * Get the next stage after a given stage ID
 */
export function getNextStage(currentStageId: string): Stage | undefined {
  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId)
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return undefined
  }
  return stages[currentIndex + 1]
}
