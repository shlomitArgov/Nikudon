import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * Cumulative correct/total trial counts per stage ID, persisted across
 * sessions so a child's progress survives closing the app. Shared across
 * Home (which gates level entry and shows "X / Y so far") and the drill
 * (which records every answered trial).
 */
const STORAGE_KEY = 'nikudon:stageProgress'

interface StoredProgress {
  correctCounts: Record<string, number>
  totalCounts: Record<string, number>
}

interface StageProgressContextValue {
  correctCounts: Record<string, number>
  totalCounts: Record<string, number>
  recordAnswer: (stageId: string, isCorrect: boolean) => void
}

const StageProgressContext = createContext<StageProgressContextValue | undefined>(
  undefined
)

function loadProgress(): StoredProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { correctCounts: {}, totalCounts: {} }
    const parsed = JSON.parse(raw)
    if (parsed.correctCounts || parsed.totalCounts) {
      return {
        correctCounts: parsed.correctCounts ?? {},
        totalCounts: parsed.totalCounts ?? {},
      }
    }
    // Pre-existing data from before totalCounts was tracked: a flat
    // stageId -> correctCount map. Keep it as correctCounts and seed
    // totalCounts the same so "X / Y" doesn't show a nonsensical 0 total.
    return { correctCounts: parsed, totalCounts: parsed }
  } catch {
    // Storage unavailable or corrupt (e.g. private browsing) — start fresh.
    return { correctCounts: {}, totalCounts: {} }
  }
}

export function StageProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<StoredProgress>(loadProgress)

  const recordAnswer = (stageId: string, isCorrect: boolean) => {
    setProgress((prev) => {
      const next: StoredProgress = {
        correctCounts: {
          ...prev.correctCounts,
          [stageId]: (prev.correctCounts[stageId] ?? 0) + (isCorrect ? 1 : 0),
        },
        totalCounts: {
          ...prev.totalCounts,
          [stageId]: (prev.totalCounts[stageId] ?? 0) + 1,
        },
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Progress just won't persist this session; in-memory state still works.
      }
      return next
    })
  }

  return (
    <StageProgressContext.Provider
      value={{
        correctCounts: progress.correctCounts,
        totalCounts: progress.totalCounts,
        recordAnswer,
      }}
    >
      {children}
    </StageProgressContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStageProgress(): StageProgressContextValue {
  const ctx = useContext(StageProgressContext)
  if (!ctx) {
    throw new Error('useStageProgress must be used within a StageProgressProvider')
  }
  return ctx
}
