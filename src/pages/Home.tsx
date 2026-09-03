import { useNavigate } from 'react-router-dom'
import { getFirstStage } from '../content/stages'
import { unlockAudio } from '../hooks/useAudioPlayer'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  const handleStart = () => {
    unlockAudio()
    const firstStage = getFirstStage()
    navigate(`/stage/${firstStage.id}`)
  }

  return (
    <div className="home">
      <div className="home-content">
        <h1 className="home-title">ניקודון</h1>

        {/* Play button instead of text */}
        <button className="home-start-button" aria-label="Start" onClick={handleStart}>
          <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Home
