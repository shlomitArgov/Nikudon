import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getStage, getFirstStage } from '../content/stages'
import { getNikudGroup, type NikudGroupId } from '../content/nikudGroups'
import { generateTrial, type Trial } from '../engine/stageRunner'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import './StagePlayer.css'

// Auto-advance delay after a correct tap, within the 800-1200ms UX range.
const AUTO_ADVANCE_DELAY_MS = 1000

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

  const advanceTimer = useRef<number | null>(null)
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

  // Clear any pending auto-advance timer on unmount, so no state is set
  // after unmount.
  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current)
      }
    }
  }, [])

  const handleForward = () => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = null
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

  const handleBack = () => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleOptionSelect = (groupId: NikudGroupId) => {
    if (!currentTrial) return

    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }

    const isCorrect = groupId === currentTrial.correctGroupId
    const answerIndex = currentIndex

    setAnswers((prev) => {
      const next = [...prev]
      next[answerIndex] = { selectedGroupId: groupId, isCorrect }
      return next
    })

    if (isCorrect) {
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null
        handleForward()
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

      <div className="trial-content">
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

        <div className="nav-container">
          <button
            className="nav-button nav-back"
            onClick={handleBack}
            disabled={currentIndex === 0}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="nav-button nav-forward"
            onClick={handleForward}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}

export default StagePlayer
