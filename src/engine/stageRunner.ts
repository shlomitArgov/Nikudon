import { Stage } from '../content/stages'
import { NikudGroupId, getNikudGroup, getAllNikudGroupIds } from '../content/nikudGroups'

/**
 * Trial/question in a stage
 */
export interface Trial {
  id: string
  correctGroupId: NikudGroupId // The correct answer (nikud group)
  options: NikudGroupId[] // Available answer options (2-3 groups, all with unique sounds)
  audioSyllable: string // Syllable to play (e.g., "בַּ")
}

/**
 * Trial result
 */
export interface TrialResult {
  trialId: string
  selectedGroupId: NikudGroupId | null
  correctGroupId: NikudGroupId
  isCorrect: boolean
  timestamp: number
}

/**
 * Stage progress tracking
 */
export interface StageProgress {
  stageId: string
  trialsCompleted: number
  trialsCorrect: number
  trialResults: TrialResult[]
  isMastered: boolean
}

/**
 * Mastery configuration
 */
export interface MasteryConfig {
  minTrials: number // Minimum number of trials before mastery can be achieved
  maxTrials: number // Maximum number of trials before forcing completion
  requiredAccuracy: number // Required accuracy percentage (0-1, e.g., 0.8 for 80%)
}

const DEFAULT_MASTERY_CONFIG: MasteryConfig = {
  minTrials: 8,
  maxTrials: 12,
  requiredAccuracy: 0.8, // 80%
}

/**
 * Generate a trial/question for a stage
 */
export function generateTrial(
  stage: Stage,
  usedSyllables: Set<string> = new Set()
): Trial {
  // Randomly select the correct answer (weighted toward the introduced group)
  // 60% chance for introduced group, 40% split among review groups
  const random = Math.random()
  let correctGroupId: NikudGroupId
  if (random < 0.6 || stage.reviewGroupIds.length === 0) {
    correctGroupId = stage.introducedGroupId
  } else {
    const reviewIndex = Math.floor(Math.random() * stage.reviewGroupIds.length)
    correctGroupId = stage.reviewGroupIds[reviewIndex]
  }

  // Get example syllables for the correct group
  const correctGroup = getNikudGroup(correctGroupId)
  if (!correctGroup) {
    throw new Error(`Invalid group ID: ${correctGroupId}`)
  }

  // Select a syllable that hasn't been used recently
  const availableSyllables = correctGroup.exampleSyllables.filter(
    (s) => !usedSyllables.has(s)
  )
  const audioSyllable =
    availableSyllables.length > 0
      ? availableSyllables[Math.floor(Math.random() * availableSyllables.length)]
      : correctGroup.exampleSyllables[
          Math.floor(Math.random() * correctGroup.exampleSyllables.length)
        ]

  // Generate options: correct answer + 1-2 incorrect options
  // Ensure all options have unique sounds (different group IDs)
  // If stage doesn't have enough review groups, use all available groups as potential distractors
  const allAvailableGroups = getAllNikudGroupIds()
  const incorrectGroups = allAvailableGroups.filter((id) => id !== correctGroupId)
  const numOptions = Math.random() < 0.5 ? 2 : 3 // Always show 2-3 options
  const numIncorrect = numOptions - 1

  // Select incorrect options randomly from all available groups
  const shuffledIncorrect = [...incorrectGroups].sort(() => Math.random() - 0.5)
  const selectedIncorrect = shuffledIncorrect.slice(0, numIncorrect)

  // Combine and shuffle all options
  const allOptions = [correctGroupId, ...selectedIncorrect].sort(
    () => Math.random() - 0.5
  )

  return {
    id: `trial-${Date.now()}-${Math.random()}`,
    correctGroupId,
    options: allOptions,
    audioSyllable,
  }
}

/**
 * Check if a stage has been mastered based on progress
 */
export function checkMastery(
  progress: StageProgress,
  config: MasteryConfig = DEFAULT_MASTERY_CONFIG
): boolean {
  // Must complete minimum trials
  if (progress.trialsCompleted < config.minTrials) {
    return false
  }

  // If max trials reached, check accuracy
  if (progress.trialsCompleted >= config.maxTrials) {
    const accuracy = progress.trialsCorrect / progress.trialsCompleted
    return accuracy >= config.requiredAccuracy
  }

  // Check if accuracy requirement is met (with minimum trials)
  const accuracy = progress.trialsCorrect / progress.trialsCompleted
  return accuracy >= config.requiredAccuracy
}

/**
 * Create initial progress for a stage
 */
export function createStageProgress(stageId: string): StageProgress {
  return {
    stageId,
    trialsCompleted: 0,
    trialsCorrect: 0,
    trialResults: [],
    isMastered: false,
  }
}

/**
 * Record a trial result and update progress
 */
export function recordTrialResult(
  progress: StageProgress,
  result: TrialResult,
  config: MasteryConfig = DEFAULT_MASTERY_CONFIG
): StageProgress {
  const updatedResults = [...progress.trialResults, result]
  const trialsCompleted = updatedResults.length
  const trialsCorrect = updatedResults.filter((r) => r.isCorrect).length

  const updatedProgress: StageProgress = {
    ...progress,
    trialsCompleted,
    trialsCorrect,
    trialResults: updatedResults,
    isMastered: checkMastery(
      {
        ...progress,
        trialsCompleted,
        trialsCorrect,
        trialResults: updatedResults,
        isMastered: false,
      },
      config
    ),
  }

  return updatedProgress
}
