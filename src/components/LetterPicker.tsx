import { useState } from 'react'
import { letters } from '../content/letters'
import { type NikudGroupId } from '../content/nikudGroups'
import { useSelectedLetter } from '../context/LetterContext'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import './LetterPicker.css'

/**
 * Alphabet button + letter grid. Tapping the button (an "alef-tav" icon that
 * also shows the current letter) opens a grid of the 22 non-final Hebrew
 * consonants; picking one sets the shared selected letter the stage plays with.
 *
 * On selection it also plays the newly-chosen letter with a niqqud so the child
 * hears how the new letter sounds. `previewGroupId` picks which niqqud to voice
 * (e.g. the current trial's, in the drill); defaults to the "a" sound.
 */
function LetterPicker({ previewGroupId = 'a' }: { previewGroupId?: NikudGroupId }) {
  const { selectedLetter, setSelectedLetter } = useSelectedLetter()
  const { play } = useAudioPlayer()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="alphabet-button"
        onClick={() => setOpen(true)}
        aria-label="Choose letter"
      >
        <span className="alphabet-icon">א־ת</span>
        <span className="alphabet-current">{selectedLetter}</span>
      </button>

      {open && (
        <div className="letter-picker" role="dialog" aria-label="Choose a letter">
          <div className="letter-grid">
            {letters.map((letter) => (
              <button
                key={letter}
                className={`letter-option${
                  letter === selectedLetter ? ' selected' : ''
                }`}
                onClick={() => {
                  setSelectedLetter(letter)
                  // Voice the new letter with its niqqud (e.g. 'ב-a').
                  play(`${letter}-${previewGroupId}`)
                  setOpen(false)
                }}
                aria-label={letter}
              >
                {letter}
              </button>
            ))}
          </div>
          <button
            className="letter-picker-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}

export default LetterPicker
