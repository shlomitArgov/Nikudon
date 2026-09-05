import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirstStage, getStageGraphemes, type Stage } from '../content/stages'
import { isolatedNiqud } from '../content/nikudGroups'
import { useAudioPlayer, unlockAudio } from '../hooks/useAudioPlayer'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const { play } = useAudioPlayer()
  // In-memory: which niqqud names (audioIds) the child has tapped, per level.
  // Entering a level is gated on having tapped (heard the name of) every one.
  const [tapped, setTapped] = useState<Record<string, Set<string>>>({})

  // Only level 1 is audio-backed for now; more levels appear as content lands.
  const levels: Stage[] = [getFirstStage()]

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

        <div className="level-list">
          {levels.map((stage) => {
            const graphemes = getStageGraphemes(stage)
            const tappedForLevel = tapped[stage.id] ?? new Set<string>()
            const allTapped = graphemes.every((g) =>
              tappedForLevel.has(g.audioId)
            )
            const levelNumber = stage.id.replace(/\D/g, '') || stage.id

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
                        {isolatedNiqud(g)}
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
