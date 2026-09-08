import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  stages,
  getStageGraphemes,
  isStageUnlocked,
  type Stage,
} from '../content/stages'
import { isolatedNiqud } from '../content/nikudGroups'
import { useAudioPlayer, unlockAudio } from '../hooks/useAudioPlayer'
import { useStageProgress } from '../context/StageProgressContext'
import LetterPicker from '../components/LetterPicker'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const { play } = useAudioPlayer()
  const { correctCounts } = useStageProgress()
  // In-memory: which niqqud names (audioIds) the child has tapped, per level.
  // Entering a level is gated on having tapped (heard the name of) every one.
  const [tapped, setTapped] = useState<Record<string, Set<string>>>({})

  const handleNiqudTap = (levelId: string, audioId: string) => {
    // Mark as heard FIRST, so the gate always updates regardless of anything
    // audio-related. Then play the niqqud's name (the first tap of the session
    // also unlocks the shared AudioContext via play()'s synchronous resume()).
    setTapped((prev) => {
      const forLevel = new Set(prev[levelId] ?? [])
      forLevel.add(audioId)
      return { ...prev, [levelId]: forLevel }
    })
    play(audioId)
  }

  const handleEnter = (stage: Stage) => {
    unlockAudio()
    navigate(`/stage/${stage.id}`)
  }

  return (
    <div className="home">
      <div className="home-content">
        <h1 className="home-title">ניקודון</h1>

        <div className="letter-picker-slot">
          <LetterPicker />
        </div>

        <div className="level-list">
          {stages.map((stage, index) => {
            const levelNumber = stage.id.replace(/\D/g, '') || stage.id
            const unlocked = isStageUnlocked(index, correctCounts)

            if (!unlocked) {
              return (
                <div className="level-card locked" key={stage.id}>
                  <div className="level-badge" aria-label={`Level ${levelNumber}`}>
                    {levelNumber}
                  </div>
                  <div className="level-lock" aria-label="Locked" role="img">
                    🔒
                  </div>
                </div>
              )
            }

            const graphemes = getStageGraphemes(stage)
            const tappedForLevel = tapped[stage.id] ?? new Set<string>()
            const allTapped = graphemes.every((g) =>
              tappedForLevel.has(g.audioId)
            )

            return (
              <div className="level-card" key={stage.id}>
                <div className="level-badge" aria-label={`Level ${levelNumber}`}>
                  {levelNumber}
                </div>

                <div className="level-niquds">
                  {graphemes.map((g) => {
                    const isTapped = tappedForLevel.has(g.audioId)
                    return (
                      <button
                        key={g.audioId}
                        className={`niqud-button${isTapped ? ' tapped' : ''}`}
                        onClick={() => handleNiqudTap(stage.id, g.audioId)}
                        aria-label={g.name}
                      >
                        <span className="niqud-glyph">{isolatedNiqud(g)}</span>
                      </button>
                    )
                  })}
                </div>

                <button
                  className={`enter-level-button${allTapped ? ' ready' : ''}`}
                  onClick={() => handleEnter(stage)}
                  disabled={!allTapped}
                  aria-label="Start level"
                >
                  <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Home
