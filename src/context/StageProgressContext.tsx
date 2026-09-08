import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * Cumulative correct-trial counts per stage ID, persisted across sessions so a
 * child's unlock progress survives closing the app. Shared across Home (which
 * gates level entry) and the drill (which records correct taps).
 */
const STORAGE_KEY = 'nikudon:stageProgress'

interface StageProgressContextValue {
  correctCounts: Record<string, number>
  recordCorrect: (stageId: string) => void
}

const StageProgressContext = createContext<StageProgressContextValue | undefined>(
  undefined
)

function loadCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    // Storage unavailable or corrupt (e.g. private browsing) — start fresh.
    return {}
  }
}

export function StageProgressProvider({ children }: { children: ReactNode }) {
  const [correctCounts, setCorrectCounts] = useState<Record<string, number>>(
    loadCounts
  )

  const recordCorrect = (stageId: string) => {
    setCorrectCounts((prev) => {
      const next = { ...prev, [stageId]: (prev[stageId] ?? 0) + 1 }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Progress just won't persist this session; in-memory state still works.
      }
      return next
    })
  }

  return (
    <StageProgressContext.Provider value={{ correctCounts, recordCorrect }}>
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
