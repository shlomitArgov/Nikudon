import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getStage, getFirstStage } from '../content/stages'
import { getNikudGroup, type NikudGroupId } from '../content/nikudGroups'
import { generateTrial, type Trial } from '../engine/stageRunner'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import './StagePlayer.css'

// After a correct tap, hold the green feedback visible this long before
// starting the fade-out transition to the next trial.
const AUTO_ADVANCE_DELAY_MS = 3000
// Duration of the slow crossfade out (and back in) between trials.
const FADE_DURATION_MS = 800

interface TrialAnswer {
  selectedGroupId: NikudGroupId
  isCorrect: boolean
}

function StagePlayer() {
  const { stageId } = useParams<{ stageId?: string }>()
  const { play, isReady } = useAudioPlayer()
  const [stage] = useState(getStage(stageId || '') || getFirstStage())
  const [trials, setTrials] = useState<Trial[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<TrialAnswer | null>>([])
  const [usedSyllables, setUsedSyllables] = useState<Set<string>>(new Set())
  // True while the current trial is fading out just before an auto-advance.
  const [isFadingOut, setIsFadingOut] = useState(false)

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

  // Auto-play (C2): fire once per trial id, once the audio buffers are ready.
  // Fires for the first trial once isReady flips true (AudioContext already
  // unlocked by Home's start tap), and again on every navigated-to new trial.
  useEffect(() => {
    if (
      isReady &&
      currentTrial &&
      lastAutoPlayedTrialId.current !== currentTrial.id
    ) {
      play(currentTrial.correctGroupId)
      lastAutoPlayedTrialId.current = currentTrial.id
    }
  }, [isReady, currentTrial, play])

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
      // Hold the green feedback for a beat, then slow-fade out and advance to
      // the next trial (which fades back in) — a gentle transition for kids.
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

  if (!stage || !currentTrial) {
    return <div className="stage-player">טוען...</div>
  }

  const currentAnswer = answers[currentIndex] ?? null
  // Minimal-text UI: show the stage as a numeric corner badge (e.g. "stage-1"
  // -> "1") instead of a Hebrew "שלב" label — pre-literate, icon/number only.
  const stageNumber = stage.id.replace(/\D/g, '') || stage.id

  return (
    <div className="stage-player">
      <div className="stage-badge" aria-label={`Stage ${stageNumber}`}>
        {stageNumber}
      </div>
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
            {currentTrial.options.map((groupId) => {
              const group = getNikudGroup(groupId)
              if (!group) return null

              const isSelectedAnswer = currentAnswer?.selectedGroupId === groupId
              let buttonClass = 'option-button'
              if (isSelectedAnswer) {
                buttonClass += currentAnswer!.isCorrect ? ' correct' : ' incorrect'
              }

              return (
                <button
                  key={groupId}
                  className={buttonClass}
                  onClick={() => handleOptionSelect(groupId)}
                >
                  {group.label}
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
