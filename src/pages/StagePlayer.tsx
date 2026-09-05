import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStage, getFirstStage, getStageGraphemes } from '../content/stages'
import { type NikudGroupId, isolatedNiqud } from '../content/nikudGroups'
import { generateTrial, type Trial } from '../engine/stageRunner'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import './StagePlayer.css'

// After a correct tap, hold the (locked, grayed) feedback visible this long
// before starting the fade-out transition to the next trial.
const AUTO_ADVANCE_DELAY_MS = 2000
// Duration of the slow crossfade out (and back in) between trials.
const FADE_DURATION_MS = 800
// After a new trial loads, wait this long — letting the whole page render /
// fade in — before auto-playing its sound and releasing the screen lock.
const AUTO_PLAY_DELAY_MS = 700

interface TrialAnswer {
  selectedGroupId: NikudGroupId
  isCorrect: boolean
}

function StagePlayer() {
  const { stageId } = useParams<{ stageId?: string }>()
  const navigate = useNavigate()
  const { play, isReady } = useAudioPlayer()
  const [stage] = useState(getStage(stageId || '') || getFirstStage())
  const [trials, setTrials] = useState<Trial[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<TrialAnswer | null>>([])
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
    const groupId = currentTrial.correctGroupId
    const timer = window.setTimeout(() => {
      if (isReady && lastAutoPlayedTrialId.current !== trialId) {
        play(groupId)
        lastAutoPlayedTrialId.current = trialId
      }
      setIsLocked(false)
    }, AUTO_PLAY_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [currentTrial, isReady, play])

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

  const handleForward = () => {
    cancelAutoAdvance()

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

    setAnswers((prev) => {
      const next = [...prev]
      next[answerIndex] = { selectedGroupId: groupId, isCorrect }
      return next
    })

    if (isCorrect) {
      // Lock + gray the screen immediately, hold the green feedback for a beat,
      // then slow-fade out and advance to the next trial (which fades back in).
      // The lock is released once the next page has settled (auto-play effect).
      setIsLocked(true)
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null
        setIsFadingOut(true)
        fadeTimer.current = window.setTimeout(() => {
          fadeTimer.current = null
          handleForward()
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
              {isolatedNiqud(g)}
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
          <span className="position-count">
            {currentIndex + 1} / {trials.length}
          </span>
          {currentAnswer && (
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
          )}
        </div>
      </div>

      <div className={`trial-content${isFadingOut ? ' fading-out' : ''}`}>
        <div className="audio-display">
          <button
            className="play-audio-button"
            onClick={() => play(currentTrial.correctGroupId)}
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
                  {option.grapheme}
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
