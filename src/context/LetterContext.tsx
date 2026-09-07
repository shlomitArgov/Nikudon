import { createContext, useContext, useState, type ReactNode } from 'react'
import { letters, type Letter } from '../content/letters'

/**
 * The Hebrew consonant the stage is currently played with. Shared across the
 * Home menu and the drill so a letter chosen on one screen carries to the other.
 * Defaults to Alef (the neutral carrier used before letter selection existed).
 */
interface LetterContextValue {
  selectedLetter: Letter
  setSelectedLetter: (letter: Letter) => void
}

const LetterContext = createContext<LetterContextValue | undefined>(undefined)

export function LetterProvider({ children }: { children: ReactNode }) {
  const [selectedLetter, setSelectedLetter] = useState<Letter>(letters[0]) // Alef
  return (
    <LetterContext.Provider value={{ selectedLetter, setSelectedLetter }}>
      {children}
    </LetterContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSelectedLetter(): LetterContextValue {
  const ctx = useContext(LetterContext)
  if (!ctx) {
    throw new Error('useSelectedLetter must be used within a LetterProvider')
  }
  return ctx
}
