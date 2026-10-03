import type { NikudGroupId } from '../content/nikudGroups'

export interface TrialAnswer {
  // null means the trial was skipped (navigated past without answering).
  selectedGroupId: NikudGroupId | null
  isCorrect: boolean
}

export type AnswerSlot = TrialAnswer | null

/**
 * Records a tap: overwrites this trial's slot with the tapped option and
 * whether it matched the correct group. Re-tapping overwrites rather than
 * accumulates, so re-answering a trial never double-counts it.
 */
export function applyAnswer(
  answers: AnswerSlot[],
  index: number,
  groupId: NikudGroupId,
  correctGroupId: NikudGroupId
): AnswerSlot[] {
  const next = [...answers]
  next[index] = { selectedGroupId: groupId, isCorrect: groupId === correctGroupId }
  return next
}

export function wasAlreadyCorrect(answers: AnswerSlot[], index: number): boolean {
  return answers[index]?.isCorrect === true
}

export interface SkipResolution {
  answers: AnswerSlot[]
  // Whether this call actually transitioned the slot into a skip — the
  // caller should only feed the persisted lifetime stats on a transition,
  // not every time the child revisits an already-resolved trial.
  newlySkipped: boolean
}

/**
 * Leaving a trial behind without ever getting it right counts as a skip —
 * whether it was never touched at all, or tapped wrong and abandoned
 * instead of retried. A trial already correct, or already converted to a
 * skip, is left untouched (idempotent).
 */
export function resolveAsSkippedIfUnresolved(
  answers: AnswerSlot[],
  index: number
): SkipResolution {
  const existing = answers[index]
  const notYetResolved =
    !existing || (!existing.isCorrect && existing.selectedGroupId !== null)
  if (!notYetResolved) {
    return { answers, newlySkipped: false }
  }
  const next = [...answers]
  next[index] = { selectedGroupId: null, isCorrect: false }
  return { answers: next, newlySkipped: true }
}

export interface SessionStats {
  correct: number
  total: number
}

/**
 * "X / Y" for this visit, derived from the answer history rather than a
 * separately-incremented counter. A skip (selectedGroupId null) counts
 * toward the total but not correct; a wrong-but-not-yet-resolved trial
 * (tapped wrong, not yet retried or skipped) counts toward neither.
 */
export function deriveSessionStats(answers: AnswerSlot[]): SessionStats {
  const answered = answers.filter((a): a is TrialAnswer => a !== null)
  const correct = answered.filter((a) => a.isCorrect).length
  const total = answered.filter(
    (a) => a.isCorrect || a.selectedGroupId === null
  ).length
  return { correct, total }
}
