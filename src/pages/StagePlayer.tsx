import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStage, getFirstStage, getStageGraphemes } from '../content/stages'
import { type NikudGroupId, isolatedNiqud } from '../content/nikudGroups'
import { generateTrial, type Trial } from '../engine/stageRunner'
import {
  applyAnswer,
  deriveSessionStats,
  resolveAsSkippedIfUnresolved,
  wasAlreadyCorrect,
  type AnswerSlot,
} from '../engine/answerTracking'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useSelectedLetter } from '../context/LetterContext'
import { useStageProgress } from '../context/StageProgressContext'
import LetterPicker from '../components/LetterPicker'
import NiqudDots from '../components/NiqudDots'
import './StagePlayer.css'

// After a correct tap, hold the (locked, grayed) feedback visible this long
// before starting the fade-out transition to the next trial.
const AUTO_ADVANCE_DELAY_MS = 2000
// Duration of the slow crossfade out (and back in) between trials.
const FADE_DURATION_MS = 800
// After a new trial loads, wait this long — letting the whole page render /
// fade in — before auto-playing its sound and releasing the screen lock.
const AUTO_PLAY_DELAY_MS = 700

function StagePlayer() {
  const { stageId } = useParams<{ stageId?: string }>()
  const navigate = useNavigate()
  const { selectedLetter } = useSelectedLetter()
  // recordAnswer persists into the lifetime, cross-session unlock-gate stats
  // (StageProgressContext/localStorage).
  const { recordAnswer } = useStageProgress()
  const { play, isReady } = useAudioPlayer()
  const [stage] = useState(getStage(stageId || '') || getFirstStage())
  const [trials, setTrials] = useState<Trial[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerSlot[]>([])
  const [usedSyllables, setUsedSyllables] = useState<Set<string>>(new Set())
  // True while the current trial is fading out just before an auto-advance.
  const [isFadingOut, setIsFadingOut] = useState(false)
  // True from a correct tap until the next trial has settled — locks and grays
  // the screen (blocks taps) for the duration of the auto-advance transition.
  const [isLocked, setIsLocked] = useState(false)
  // Whether the icon-only "leave to the main menu?" confirmation is showing.
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const advanceTimer = useRef<number | null>(null)
  const fadeTimer = useRef<number | null>(null)
  const lastAutoPlayedTrialId = useRef<string | null>(null)

  // Generate first trial when stage loads. Intentionally depends on stage.id
  // only (not stage/usedSyllables) — this must run once per stage change,
  // not re-run every time usedSyllables is updated inside the effect itself.
  useEffect(() => {
    if (stage) {
      const trial = generateTrial(stage, usedSyllables)
      setTrials([trial])
      setCurrentIndex(0)
      setAnswers([null])
      setUsedSyllables((prev) => new Set(prev).add(trial.audioSyllable))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.id])

  const currentTrial: Trial | null = trials[currentIndex] ?? null

  // After a new trial loads, let the whole page render / fade in first, THEN
  // play its sound — and, if we were mid auto-advance, release the screen lock.
  // Both wait AUTO_PLAY_DELAY_MS. Plays once per trial id (guarded by the ref),
  // so it fires for the first trial once isReady flips true (AudioContext
  // unlocked by Home's start tap) and again on every navigated-to new trial.
  useEffect(() => {
    if (!currentTrial) return
    const trialId = currentTrial.id
    // Sound is per (letter, sound-group), e.g. 'ב-a' — so it matches the letter
    // the niqqud is shown on, not a fixed Alef.
    const soundKey = `${selectedLetter}-${currentTrial.correctGroupId}`
    const timer = window.setTimeout(() => {
      if (isReady && lastAutoPlayedTrialId.current !== trialId) {
        play(soundKey)
        lastAutoPlayedTrialId.current = trialId
      }
      setIsLocked(false)
    }, AUTO_PLAY_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [currentTrial, isReady, play, selectedLetter])

  // Clear any pending auto-advance / fade timers on unmount, so no state is
  // set after unmount.
  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current)
      }
      if (fadeTimer.current !== null) {
        window.clearTimeout(fadeTimer.current)
      }
    }
  }, [])

  // Cancel any pending auto-advance countdown or in-progress fade (e.g. when
  // the child manually navigates or re-answers).
  const cancelAutoAdvance = () => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
    if (fadeTimer.current !== null) {
      window.clearTimeout(fadeTimer.current)
      fadeTimer.current = null
    }
    setIsFadingOut(false)
    setIsLocked(false)
  }

  // Feeds the lifetime unlock-gate stats (persisted). The on-screen "X / Y"
  // is derived straight from `answers` below instead — one slot per trial,
  // so re-answering a trial overwrites its slot rather than counting again.

  const handleForward = () => {
    cancelAutoAdvance()

    const { answers: resolvedAnswers, newlySkipped } = resolveAsSkippedIfUnresolved(
      answers,
      currentIndex
    )
    if (newlySkipped) {
      setAnswers(resolvedAnswers)
      recordAnswer(stage.id, false)
    }

    if (currentIndex < trials.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      return
    }

    const newTrial = generateTrial(stage, usedSyllables)
    setTrials((prev) => [...prev, newTrial])
    setAnswers((prev) => [...prev, null])
    setUsedSyllables((prev) => new Set(prev).add(newTrial.audioSyllable))
    setCurrentIndex(trials.length)
  }

  // The auto-advance timeout chain below calls handleForward well after the
  // render that scheduled it — by then `answers`/`currentIndex` have moved
  // on, but a closure captured at schedule-time would still see the OLD
  // values (a correct answer looking un-answered, wrongly re-marked as
  // skipped). Keeping a ref to the latest handleForward and calling that
  // from the timeout instead means it always reads current state.
  const handleForwardRef = useRef(handleForward)
  useEffect(() => {
    handleForwardRef.current = handleForward
  })

  const handleBack = () => {
    cancelAutoAdvance()
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleOptionSelect = (groupId: NikudGroupId) => {
    if (!currentTrial) return

    cancelAutoAdvance()

    const isCorrect = groupId === currentTrial.correctGroupId
    const answerIndex = currentIndex
    // Was this trial already marked correct before this tap? Re-answering
    // an already-correct trial (e.g. navigating back and tapping it again)
    // must not count a second time toward the unlock gate or "X / Y".
    const alreadyCorrect = wasAlreadyCorrect(answers, answerIndex)

    // Audio feedback: play the sound of the tapped letter+niqqud (keyed by the
    // selected letter and the option's sound-group, e.g. 'ב-a') so the child
    // hears what they picked — whether right or wrong.
    play(`${selectedLetter}-${groupId}`)

    setAnswers(applyAnswer(answers, answerIndex, groupId, currentTrial.correctGroupId))

    if (isCorrect) {
      // Counts toward this stage's unlock threshold — once per trial, not
      // once per tap. A wrong tap records nothing (handled above by simply
      // not calling recordAnswer here).
      if (!alreadyCorrect) {
        recordAnswer(stage.id, true)
      }
      // Lock + gray the screen immediately, hold the green feedback for a beat,
      // then slow-fade out and advance to the next trial (which fades back in).
      // The lock is released once the next page has settled (auto-play effect).
      setIsLocked(true)
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null
        setIsFadingOut(true)
        fadeTimer.current = window.setTimeout(() => {
          fadeTimer.current = null
          handleForwardRef.current()
        }, FADE_DURATION_MS)
      }, AUTO_ADVANCE_DELAY_MS)
    }
  }

  // Leaving the drill is gated by an icon-only confirmation so a child can't
  // exit to the menu by accident. Opening it also cancels any pending
  // auto-advance so the drill doesn't move on behind the dialog.
  const handleLeaveRequest = () => {
    cancelAutoAdvance()
    setShowLeaveConfirm(true)
  }
  const handleLeaveConfirm = () => {
    navigate('/')
  }
  const handleLeaveCancel = () => {
    setShowLeaveConfirm(false)
  }

  if (!stage || !currentTrial) {
    return <div className="stage-player">טוען...</div>
  }

  const currentAnswer = answers[currentIndex] ?? null
  // "X / Y" for this visit, derived from the answer history rather than a
  // separately-incremented counter — see deriveSessionStats for the rules.
  const { correct: sessionCorrect, total: sessionTotal } = deriveSessionStats(answers)
  // Minimal-text UI: show the stage as a numeric corner badge (e.g. "stage-1"
  // -> "1") instead of a Hebrew "שלב" label — pre-literate, icon/number only.
  const stageNumber = stage.id.replace(/\D/g, '') || stage.id
  // Mini niqqud reminders shown next to the stage number: tap to re-hear a
  // niqqud's name if the child forgets it mid-drill (same set as the Home gate).
  const levelGraphemes = getStageGraphemes(stage)

  return (
    <div className="stage-player">
      {isLocked && <div className="lock-overlay" aria-hidden="true" />}
      {showLeaveConfirm && (
        <div className="leave-confirm" role="dialog" aria-label="Leave to menu?">
          <div className="leave-confirm-card">
            <div className="leave-confirm-icon" aria-hidden="true">🏠</div>
            <div className="leave-confirm-actions">
              <button
                className="confirm-button confirm-yes"
                onClick={handleLeaveConfirm}
                aria-label="Yes, go to menu"
              >
                ✓
              </button>
              <button
                className="confirm-button confirm-no"
                onClick={handleLeaveCancel}
                aria-label="No, stay"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="stage-corner">
        <div className="stage-badge" aria-label={`Stage ${stageNumber}`}>
          {stageNumber}
        </div>
        <div className="niqud-reminder">
          {levelGraphemes.map((g) => (
            <button
              key={g.audioId}
              className="niqud-reminder-button"
              onClick={() => play(g.audioId)}
              aria-label={g.name}
            >
              {g.dotPattern ? (
                <NiqudDots
                  pattern={g.dotPattern}
                  position={g.isAboveMark ? 'above-left' : 'bottom'}
                />
              ) : g.isLetterGlyph ? (
                <span className="niqud-glyph niqud-glyph-letter">
                  {isolatedNiqud(g)}
                </span>
              ) : (
                <span className="niqud-glyph">{isolatedNiqud(g)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <button
        className="home-button"
        onClick={handleLeaveRequest}
        aria-label="Home"
      >
        🏠
      </button>
      <div className="stage-header">
        <div className="position-indicator">
          <span
            className="stage-progress"
            aria-label={`${sessionCorrect} correct out of ${sessionTotal}`}
          >
            {sessionCorrect} / {sessionTotal}
          </span>
          {currentAnswer &&
            (currentAnswer.selectedGroupId !== null ? (
              <span
                className={
                  currentAnswer.isCorrect
                    ? 'position-status status-correct'
                    : 'position-status status-incorrect'
                }
                aria-hidden="true"
              >
                {currentAnswer.isCorrect ? '✓' : '✕'}
              </span>
            ) : (
              // Skipped — visited and moved past without answering, distinct
              // from a trial not yet reached at all (no icon at all).
              <span className="position-status status-skipped" aria-hidden="true">
                ⤼
              </span>
            ))}
        </div>
        <div className="letter-picker-slot">
          <LetterPicker previewGroupId={currentTrial.correctGroupId} />
        </div>
      </div>

      <div className={`trial-content${isFadingOut ? ' fading-out' : ''}`}>
        <div className="audio-display">
          <button
            className="play-audio-button"
            onClick={() => play(`${selectedLetter}-${currentTrial.correctGroupId}`)}
            aria-label="Play audio"
          >
            🔊
          </button>
        </div>

        <div className="options-container">
          <div className="options">
            {currentTrial.options.map((option) => {
              const isSelectedAnswer =
                currentAnswer?.selectedGroupId === option.groupId
              let buttonClass = 'option-button'
              if (isSelectedAnswer) {
                buttonClass += currentAnswer!.isCorrect ? ' correct' : ' incorrect'
              }

              return (
                <button
                  key={option.groupId}
                  className={buttonClass}
                  onClick={() => handleOptionSelect(option.groupId)}
                >
                  {selectedLetter + option.mark}
                </button>
              )
            })}
          </div>
        </div>

        {/* RTL: the first flex child renders on the RIGHT, so forward/next
            comes first (right side) and back/previous second (left side). */}
        <div className="nav-container">
          <button
            className="nav-button nav-forward"
            onClick={handleForward}
            aria-label="Next"
          >
            ‹
          </button>
          <button
            className="nav-button nav-back"
            onClick={handleBack}
            disabled={currentIndex === 0}
            aria-label="Previous"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}

export default StagePlayer
