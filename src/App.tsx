import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import StagePlayer from './pages/StagePlayer'
import { LetterProvider } from './context/LetterContext'
import { StageProgressProvider } from './context/StageProgressContext'
import './App.css'

function App() {
  return (
    <StageProgressProvider>
      <LetterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stage/:stageId" element={<StagePlayer />} />
            <Route path="/stage" element={<StagePlayer />} />
          </Routes>
        </BrowserRouter>
      </LetterProvider>
    </StageProgressProvider>
  )
}

export default App
