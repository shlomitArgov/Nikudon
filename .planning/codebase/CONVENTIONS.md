# Coding Conventions

**Analysis Date:** 2026-07-11

## Naming Patterns

**Files:**
- Components: PascalCase + `.tsx` (e.g., `Home.tsx`, `StagePlayer.tsx`)
- Utilities/Data: lowercase + `.ts` (e.g., `stages.ts`, `nikudGroups.ts`)
- CSS files: match component or utility name + `.css` (e.g., `StagePlayer.css`)

**Functions:**
- Component functions: PascalCase (e.g., `Home`, `StagePlayer`, `App`)
- Utility functions: camelCase with descriptive verbs (e.g., `getStage()`, `generateTrial()`, `recordTrialResult()`, `checkMastery()`)
- Event handlers: `handle` prefix in camelCase (e.g., `handleStart()`, `handleOptionSelect()`, `handleNextTrial()`)

**Variables:**
- State variables: camelCase (e.g., `stage`, `progress`, `currentTrial`, `selectedOption`)
- React hooks results: camelCase (e.g., `const navigate = useNavigate()`)
- Boolean flags: camelCase, often with `is`/`show` prefix (e.g., `isCorrect`, `showFeedback`, `isMastered`)
- Sets/Collections: plural or descriptive (e.g., `usedSyllables`, `allGroups`, `options`)

**Types:**
- Interfaces: PascalCase (e.g., `Stage`, `Trial`, `TrialResult`, `StageProgress`, `NikudGroup`, `MasteryConfig`)
- Type unions: PascalCase (e.g., `NikudGroupId`)
- Literal types: lowercase strings (e.g., `'hearAndTap' | 'matchTheMark'`)

**Constants:**
- Configuration/Magic values: UPPER_CASE (e.g., `DEFAULT_MASTERY_CONFIG`)
- Readonly data arrays: camelCase (e.g., `stages`, `nikudGroups`)

## Code Style

**Formatting:**
- No explicit Prettier config found — follows default Prettier formatting
- Line length: Not enforced explicitly; naturally follows around 80-100 chars
- Semicolons: Included throughout
- Quotes: Single quotes in JavaScript, template literals for interpolation
- Trailing commas: Used in multi-line structures

**Linting:**
- Tool: ESLint 8.55.0 with TypeScript support
- Key rules enforced:
  - `@typescript-eslint/recommended`: Type safety rules
  - `react-hooks/recommended`: React hooks best practices (deps arrays, hook placement)
  - `react-refresh/only-export-components`: Components must be default exports when using React Refresh
  - `eslint:recommended`: Base ESLint rules
  - `--max-warnings 0`: Build fails if any linting warnings exist

**TypeScript:**
- Target: ES2020
- Strict mode enabled: `strict: true`
- `noUnusedLocals: true` — all variables must be used
- `noUnusedParameters: true` — all parameters must be used
- `noFallthroughCasesInSwitch: true` — explicit switch cases required
- JSX: `react-jsx` (automatic runtime)
- Module resolution: `bundler`

## Import Organization

**Order:**
1. React and library imports (e.g., `import React from 'react'`)
2. Router and external package imports (e.g., `import { useNavigate } from 'react-router-dom'`)
3. Local content/data imports (e.g., `import { getFirstStage } from '../content/stages'`)
4. Local engine/utility imports (e.g., `import { generateTrial } from '../engine/stageRunner'`)
5. CSS imports (e.g., `import './App.css'`)

**Path style:**
- Relative paths with explicit `../` (e.g., `../content/stages`)
- No path aliases configured
- File extensions included in imports (`.tsx`, `.ts`, `.css`)

**Example pattern from `src/pages/StagePlayer.tsx`:**
```typescript
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
```

## Error Handling

**Patterns:**
- Optional chaining: Used to safely access potentially undefined values (e.g., `stage.id || getFirstStage()`)
- Null/undefined checks: Explicit conditions before using values
- Error throwing: Used in edge cases (e.g., in `generateTrial()` when invalid group ID is provided):
  ```typescript
  if (!correctGroup) {
    throw new Error(`Invalid group ID: ${correctGroupId}`)
  }
  ```
- Fallback values: Nullish coalescing and ternary operators
  ```typescript
  const stage = getStage(stageId || '') || getFirstStage()
  ```
- User feedback: `alert()` for completion notifications (e.g., `alert('🎉 כל הכבוד! סיימת את השלב!')`)
- Early returns: Used in event handlers to prevent state mutations
  ```typescript
  const handleOptionSelect = (groupId: string) => {
    if (!currentTrial || selectedOption) return
    // ... continue
  }
  ```

## Logging

**Framework:** `console` (default JavaScript logging)

**Patterns:**
- No centralized logging observed
- No explicit logging statements in source code
- Would use `console.log/warn/error` for debugging if needed

## Comments

**When to Comment:**
- JSDoc blocks for interfaces, types, and exported functions (3-line comments above definition)
- Inline comments for complex logic or explaining "why" not "what"
- HTML comments in JSX for temporary notes or clarifications

**JSDoc/TSDoc:**
- Used for all exported interfaces and data structures:
  ```typescript
  /**
   * Trial/question in a stage
   */
  export interface Trial {
    id: string
    // ...
  }
  ```
- Function documentation explains purpose and parameters implicitly through type annotations
- Examples from `src/content/stages.ts`:
  ```typescript
  /**
   * Stage configuration
   * Each stage introduces a new nikud sound-group while reviewing previously learned ones
   */
  export interface Stage {
    id: string
    // ...
  }
  ```

## Function Design

**Size:** Functions are focused and typically 10-30 lines
- `getStage()`: 1 line (single find operation)
- `generateTrial()`: 58 lines (includes comments, main game logic)
- `recordTrialResult()`: 18 lines (state aggregation)
- `checkMastery()`: 10 lines (conditional logic)

**Parameters:**
- Explicit parameter types with TypeScript
- Optional parameters: marked with `?` and default assignments
- Collections passed as typed objects (e.g., `Set<string>`)
- Example from `generateTrial()`:
  ```typescript
  export function generateTrial(
    stage: Stage,
    usedSyllables: Set<string> = new Set()
  ): Trial
  ```

**Return Values:**
- Explicit return types on all exported functions
- Return objects/arrays for multi-value returns (no tuples)
- Example from `recordTrialResult()`:
  ```typescript
  export function recordTrialResult(
    progress: StageProgress,
    result: TrialResult,
    config: MasteryConfig = DEFAULT_MASTERY_CONFIG
  ): StageProgress
  ```

## Module Design

**Exports:**
- Named exports for utilities and data (e.g., `export function getStage()`)
- Default export for React components (e.g., `export default App`)
- Type exports included in import statements (e.g., `type Trial, type StageProgress`)

**Barrel Files:** Not used — direct imports from module source files

**File Structure:**
- One component per file (`Home.tsx`, `StagePlayer.tsx`)
- Data/logic separated: `content/` for data, `engine/` for game logic
- Clear separation of concerns:
  - `src/pages/`: Route components
  - `src/content/`: Game content and data (stages, nikud groups, letters)
  - `src/engine/`: Game logic (trial generation, progress tracking, mastery)
  - `src/`: App root and routing

**As constants:** `as const` used for readonly arrays to preserve literal types:
```typescript
export const stages: Stage[] = [
  // ...
] as const
```

---

*Convention analysis: 2026-07-11*
