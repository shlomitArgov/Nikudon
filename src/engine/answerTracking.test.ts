import { describe, expect, it } from 'vitest'
import {
  applyAnswer,
  deriveSessionStats,
  resolveAsSkippedIfUnresolved,
  wasAlreadyCorrect,
  type AnswerSlot,
} from './answerTracking'

// Real group ids aren't needed for this logic — it never inspects the
// values themselves, only whether a tapped group matches the correct one.
const A = 'a'
const B = 'i'

describe('applyAnswer', () => {
  it('records a correct tap', () => {
    const answers: AnswerSlot[] = [null]
    const next = applyAnswer(answers, 0, A, A)
    expect(next[0]).toEqual({ selectedGroupId: A, isCorrect: true })
  })

  it('records a wrong tap', () => {
    const answers: AnswerSlot[] = [null]
    const next = applyAnswer(answers, 0, B, A)
    expect(next[0]).toEqual({ selectedGroupId: B, isCorrect: false })
  })

  it('overwrites rather than accumulates on re-answer', () => {
    const first = applyAnswer([null], 0, B, A) // wrong
    const second = applyAnswer(first, 0, A, A) // then correct
    expect(second).toHaveLength(1)
    expect(second[0]).toEqual({ selectedGroupId: A, isCorrect: true })
  })

  it('does not mutate the input array', () => {
    const answers: AnswerSlot[] = [null]
    applyAnswer(answers, 0, A, A)
    expect(answers[0]).toBeNull()
  })
})

describe('wasAlreadyCorrect', () => {
  it('is false for an untouched trial', () => {
    expect(wasAlreadyCorrect([null], 0)).toBe(false)
  })

  it('is false for a wrong tap', () => {
    const answers = applyAnswer([null], 0, B, A)
    expect(wasAlreadyCorrect(answers, 0)).toBe(false)
  })

  it('is true once correct', () => {
    const answers = applyAnswer([null], 0, A, A)
    expect(wasAlreadyCorrect(answers, 0)).toBe(true)
  })
})

describe('resolveAsSkippedIfUnresolved', () => {
  it('converts an untouched trial to a skip', () => {
    const { answers, newlySkipped } = resolveAsSkippedIfUnresolved([null], 0)
    expect(newlySkipped).toBe(true)
    expect(answers[0]).toEqual({ selectedGroupId: null, isCorrect: false })
  })

  it('converts a wrong-but-abandoned trial to a skip (regression: this used to silently vanish from the total)', () => {
    const wrong = applyAnswer([null], 0, B, A)
    const { answers, newlySkipped } = resolveAsSkippedIfUnresolved(wrong, 0)
    expect(newlySkipped).toBe(true)
    expect(answers[0]).toEqual({ selectedGroupId: null, isCorrect: false })
  })

  it('leaves a correct trial untouched', () => {
    const correct = applyAnswer([null], 0, A, A)
    const { answers, newlySkipped } = resolveAsSkippedIfUnresolved(correct, 0)
    expect(newlySkipped).toBe(false)
    expect(answers[0]).toEqual({ selectedGroupId: A, isCorrect: true })
  })

  it('is idempotent on a trial already marked skipped', () => {
    const { answers: skipped } = resolveAsSkippedIfUnresolved([null], 0)
    const { answers, newlySkipped } = resolveAsSkippedIfUnresolved(skipped, 0)
    expect(newlySkipped).toBe(false)
    expect(answers).toBe(skipped) // same reference: no-op, not just equal
  })
})

describe('deriveSessionStats', () => {
  it('is 0/0 with no answers', () => {
    expect(deriveSessionStats([])).toEqual({ correct: 0, total: 0 })
  })

  it('counts a correct answer in both correct and total', () => {
    const answers = applyAnswer([null], 0, A, A)
    expect(deriveSessionStats(answers)).toEqual({ correct: 1, total: 1 })
  })

  it('counts a skip in total but not correct', () => {
    const { answers } = resolveAsSkippedIfUnresolved([null], 0)
    expect(deriveSessionStats(answers)).toEqual({ correct: 0, total: 1 })
  })

  it('counts a wrong-but-unresolved tap in neither (still eligible for retry)', () => {
    const answers = applyAnswer([null], 0, B, A)
    expect(deriveSessionStats(answers)).toEqual({ correct: 0, total: 0 })
  })

  it('counts a wrong-then-skipped trial in total but not correct (the bug this session hit)', () => {
    const wrong = applyAnswer([null], 0, B, A)
    const { answers } = resolveAsSkippedIfUnresolved(wrong, 0)
    expect(deriveSessionStats(answers)).toEqual({ correct: 0, total: 1 })
  })

  it('does not double-count a trial revisited after being skipped', () => {
    const { answers: skipped } = resolveAsSkippedIfUnresolved([null], 0)
    const { answers: revisited } = resolveAsSkippedIfUnresolved(skipped, 0)
    expect(deriveSessionStats(revisited)).toEqual({ correct: 0, total: 1 })
  })

  it('does not double-count a trial re-answered correctly after being wrong', () => {
    const wrong = applyAnswer([null], 0, B, A)
    const corrected = applyAnswer(wrong, 0, A, A)
    expect(deriveSessionStats(corrected)).toEqual({ correct: 1, total: 1 })
  })

  it('tallies across multiple trials independently', () => {
    let answers: AnswerSlot[] = [null, null, null]
    answers = applyAnswer(answers, 0, A, A) // correct
    answers = applyAnswer(answers, 1, B, A) // wrong, unresolved
    answers = resolveAsSkippedIfUnresolved(answers, 2).answers // skipped
    expect(deriveSessionStats(answers)).toEqual({ correct: 1, total: 2 })
  })
})
