import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getStage, getFirstStage } from '../content/stages'
import { getNikudGroup } from '../content/nikudGroups'
import {
  generateTrial,
  recordTrialResult,
  createStageProgress,
  checkMastery,
  type Trial,
  type StageProgress,
} from '../engine/stageRunner'
import './StagePlayer.css'

function StagePlayer() {
  const { stageId } = useParams<{ stageId?: string }>()
  const [stage, setStage] = useState(getStage(stageId || '') || getFirstStage())
  const [progress, setProgress] = useState<StageProgress>(() =>
    createStageProgress(stage.id)
  )
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [usedSyllables, setUsedSyllables] = useState<Set<string>>(new Set())

  // Generate first trial when stage loads
  useEffect(() => {
    if (stage) {
      const trial = generateTrial(stage, usedSyllables)
      setCurrentTrial(trial)
      setUsedSyllables((prev) => new Set(prev).add(trial.audioSyllable))
    }
  }, [stage.id])

  const handleOptionSelect = (groupId: string) => {
    if (!currentTrial || selectedOption) return

    setSelectedOption(groupId)
    const isCorrect = groupId === currentTrial.correctGroupId

    const result = {
      trialId: currentTrial.id,
      selectedGroupId: groupId as any,
      correctGroupId: currentTrial.correctGroupId,
      isCorrect,
      timestamp: Date.now(),
    }

    const updatedProgress = recordTrialResult(progress, result)
    setProgress(updatedProgress)
    setShowFeedback(true)

    // Check if mastered
    if (checkMastery(updatedProgress)) {
      setTimeout(() => {
        alert('🎉 כל הכבוד! סיימת את השלב!')
      }, 1000)
    }
  }

  const handleNextTrial = () => {
    if (!stage) return

    const newTrial = generateTrial(stage, usedSyllables)
    setCurrentTrial(newTrial)
    setSelectedOption(null)
    setShowFeedback(false)
    setUsedSyllables((prev) => new Set(prev).add(newTrial.audioSyllable))
  }

  if (!stage || !currentTrial) {
    return <div className="stage-player">טוען...</div>
  }

  const correctGroup = getNikudGroup(currentTrial.correctGroupId)
  const isCorrect = selectedOption === currentTrial.correctGroupId

  return (
    <div className="stage-player">
      <div className="stage-header">
        <h2>שלב: {stage.id}</h2>
        <div className="progress-info">
          <p>
            ניסיונות: {progress.trialsCompleted} | נכונים: {progress.trialsCorrect}
          </p>
          <p>
            דיוק: {progress.trialsCompleted > 0
              ? Math.round((progress.trialsCorrect / progress.trialsCompleted) * 100)
              : 0}%
          </p>
        </div>
      </div>

      <div className="trial-content">
        <div className="audio-display">
          <button className="play-audio-button" onClick={() => alert('Audio will play here')} aria-label="Play audio">
            🔊
          </button>
        </div>

        <div className="options-container">
          <div className="options">
            {currentTrial.options.map((groupId) => {
              const group = getNikudGroup(groupId)
              if (!group) return null

              const isSelected = selectedOption === groupId
              const isCorrectOption = groupId === currentTrial.correctGroupId
              let buttonClass = 'option-button'
              if (showFeedback) {
                if (isCorrectOption) {
                  buttonClass += ' correct'
                } else if (isSelected && !isCorrectOption) {
                  buttonClass += ' incorrect'
                }
              }

              return (
                <button
                  key={groupId}
                  className={buttonClass}
                  onClick={() => handleOptionSelect(groupId)}
                  disabled={!!selectedOption}
                >
                  {group.label}
                </button>
              )
            })}
          </div>

          {showFeedback && (
            <div className="feedback-overlay">
              {isCorrect ? (
                <div className="feedback-popup correct-popup">
                  <div className="feedback-emoji">✅</div>
                  <div className="feedback-text">נכון!</div>
                </div>
              ) : (
                <div className="feedback-popup incorrect-popup">
                  <div className="feedback-emoji">❌</div>
                  <div className="feedback-text">לא נכון</div>
                </div>
              )}
            </div>
          )}
        </div>

        {showFeedback && !checkMastery(progress) && (
          <div className="next-button-container">
            <button className="next-button" onClick={handleNextTrial} aria-label="Next">
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StagePlayer
