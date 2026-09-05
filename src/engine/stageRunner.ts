import { Stage, getStageGroupIds } from '../content/stages'
import { NikudGroupId, getNikudGroup } from '../content/nikudGroups'

/**
 * One selectable answer in a trial: a sound-group plus the specific niqqud
 * grapheme chosen to be displayed for it this trial (CONT-03).
 */
export interface TrialOption {
  groupId: NikudGroupId
  grapheme: string
}

/**
 * Trial/question in a stage
 */
export interface Trial {
  id: string
  correctGroupId: NikudGroupId // The correct answer (nikud sound-group)
  options: TrialOption[] // Answer options: distinct sounds, each with a shown grapheme
  audioSyllable: string // Example syllable for the correct sound
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
  // The set of sounds this level teaches — the correct answer AND the
  // distractors are both drawn only from here, so an untaught sound never
  // appears as an option (ENG-01).
  const scopeGroupIds = getStageGroupIds(stage)

  // Randomly select the correct sound-group, weighted toward the newly
  // introduced group (60% introduced, 40% split among in-scope review groups).
  let correctGroupId: NikudGroupId
  if (Math.random() < 0.6 || stage.reviewGroupIds.length === 0) {
    correctGroupId = stage.introducedGroupId
  } else {
    const reviewIndex = Math.floor(Math.random() * stage.reviewGroupIds.length)
    correctGroupId = stage.reviewGroupIds[reviewIndex]
  }

  const correctGroup = getNikudGroup(correctGroupId)
  if (!correctGroup) {
    throw new Error(`Invalid group ID: ${correctGroupId}`)
  }

  // Choose an example syllable for the correct sound, avoiding recent repeats.
  const availableSyllables = correctGroup.exampleSyllables.filter(
    (s) => !usedSyllables.has(s)
  )
  const audioSyllable =
    availableSyllables.length > 0
      ? availableSyllables[Math.floor(Math.random() * availableSyllables.length)]
      : correctGroup.exampleSyllables[
          Math.floor(Math.random() * correctGroup.exampleSyllables.length)
        ]

  // Distractors come ONLY from other in-scope sound-groups (ENG-01). Each
  // option is a distinct sound-group, so no two options can ever sound
  // identical in the same trial (ENG-02).
  const distractorPool = scopeGroupIds.filter((id) => id !== correctGroupId)
  const shuffledDistractors = [...distractorPool].sort(() => Math.random() - 0.5)

  // 2-3 options total, capped by how many distinct in-scope groups exist.
  const maxOptions = Math.min(scopeGroupIds.length, Math.random() < 0.5 ? 2 : 3)
  const numIncorrect = Math.min(shuffledDistractors.length, maxOptions - 1)
  const selectedIncorrect = shuffledDistractors.slice(0, numIncorrect)

  const optionGroupIds = [correctGroupId, ...selectedIncorrect].sort(
    () => Math.random() - 0.5
  )

  // CONT-03: display a randomly-chosen grapheme for each option's sound-group,
  // so a sound with multiple spellings (e.g. Patach vs Kamatz for "ah") shows
  // a different symbol across trials rather than always the same one.
  const options: TrialOption[] = optionGroupIds.map((groupId) => {
    const graphemes = getNikudGroup(groupId)?.graphemes ?? []
    const grapheme =
      graphemes.length > 0
        ? graphemes[Math.floor(Math.random() * graphemes.length)].glyph
        : groupId
    return { groupId, grapheme }
  })

  return {
    id: `trial-${Date.now()}-${Math.random()}`,
    correctGroupId,
    options,
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
  // Mastery requires BOTH the minimum number of trials AND the accuracy
  // threshold — never on a lucky short streak before minTrials is reached
  // (ENG-03). The two conditions are ANDed, so a high streak over too few
  // trials does not count, and neither does hitting the trial count with low
  // accuracy. (config.maxTrials is reserved for a future "max attempts" cap
  // and is intentionally not used to force mastery here.)
  if (progress.trialsCompleted < config.minTrials) {
    return false
  }
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
