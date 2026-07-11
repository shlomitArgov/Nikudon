<!-- refreshed: 2026-07-11 -->
# Architecture

**Analysis Date:** 2026-07-11

## System Overview

Nikudon is an interactive PWA for teaching Hebrew Nikud symbols (vowel marks). The application presents audio syllables to learners who must identify the correct vowel mark group. The architecture follows a layered, unidirectional data flow pattern.

```text
┌─────────────────────────────────────────────────────────────┐
│                     React Router Layer                       │
│              `src/App.tsx` - Route Definitions               │
├──────────────────┬──────────────────┬───────────────────────┤
│   Home Page      │  StagePlayer     │  Route Parameters     │
│  `src/pages/     │  `src/pages/     │  URL state (stageId)  │
│   Home.tsx`      │   StagePlayer.   │                       │
│                  │   tsx`           │                       │
└────────┬─────────┴────────┬─────────┴──────────────────┬────┘
         │                  │                            │
         ▼                  ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Game Logic Layer                          │
│               `src/engine/stageRunner.ts`                    │
│   Trial generation, progress tracking, mastery detection    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Content Layer                             │
│  `src/content/` - Immutable data structures                  │
│  • stages.ts - Stage configurations & progression           │
│  • nikudGroups.ts - Vowel mark groups & metadata             │
│  • letters.ts - Hebrew alphabet reference                    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App (Router) | Client-side routing, navigation orchestration | `src/App.tsx` |
| Home | Stage selection entry point, game initiation | `src/pages/Home.tsx` |
| StagePlayer | Trial presentation, user input handling, progress display | `src/pages/StagePlayer.tsx` |
| stageRunner | Trial generation, result recording, mastery checking | `src/engine/stageRunner.ts` |
| stages | Stage definitions and progression logic | `src/content/stages.ts` |
| nikudGroups | Vowel mark groups with phonetic properties | `src/content/nikudGroups.ts` |
| letters | Hebrew alphabet reference data | `src/content/letters.ts` |

## Pattern Overview

**Overall:** Single-Page Application (SPA) with React Router and functional component architecture

**Key Characteristics:**
- **Functional React components** with hooks (useState, useEffect, useParams)
- **Immutable state management** using spread operators and new Set/Array construction
- **Pure functions** in the engine layer (stageRunner functions have no side effects)
- **Co-located styling** — CSS files paired with components in same directory
- **Content-first data modeling** — Game logic operates on well-defined domain objects (Stage, Trial, NikudGroup)

## Layers

**Presentation Layer:**
- Purpose: Render UI, capture user input, display feedback
- Location: `src/pages/`
- Contains: React components (Home.tsx, StagePlayer.tsx) with hooks and event handlers
- Depends on: React Router (navigation), engine layer (trial generation), content layer (data)
- Used by: React entry point via Router

**Routing Layer:**
- Purpose: Client-side URL routing and navigation orchestration
- Location: `src/App.tsx`
- Contains: BrowserRouter, Routes, Route definitions
- Depends on: React Router DOM
- Used by: Main entry point

**Engine Layer (Business Logic):**
- Purpose: Trial generation, progress tracking, mastery detection, result recording
- Location: `src/engine/stageRunner.ts`
- Contains: Pure functions and TypeScript interfaces (Trial, StageProgress, TrialResult, MasteryConfig)
- Depends on: Content layer (Stage, NikudGroup interfaces)
- Used by: StagePlayer component

**Content Layer (Data):**
- Purpose: Define game domain objects and reference data
- Location: `src/content/`
- Contains: Immutable data arrays and lookup functions
  - `stages.ts`: Stage[] array with progression; getStage(), getFirstStage(), getNextStage()
  - `nikudGroups.ts`: NikudGroup[] array; getNikudGroup(), getAllNikudGroupIds()
  - `letters.ts`: Hebrew alphabet reference
- Depends on: TypeScript types only
- Used by: Engine layer, pages layer

**Styling Layer:**
- Purpose: Visual presentation and responsive layout
- Location: `src/` (index.css, App.css) and `src/pages/` (component-specific CSS)
- Contains: CSS with Flexbox layout, RTL support, mobile-first design
- CSS variables: `--spacing-lg`, `--spacing-xl`, `--color-primary`
- Used by: Components via className attributes

## Data Flow

### Primary Request Path: Start Game → Answer Question → Check Mastery

1. **User initiates game** — Home.tsx renders, user clicks play button (`src/pages/Home.tsx:8-11`)
2. **Navigate to first stage** — Home uses `getFirstStage()` from content layer, router navigates to `/stage/{stageId}` (`src/pages/Home.tsx:9`)
3. **StagePlayer initializes** — Component receives stageId from URL params, loads stage via `getStage()` (`src/pages/StagePlayer.tsx:16-17`)
4. **Create progress tracker** — `createStageProgress(stage.id)` initializes state with zeroed counters (`src/engine/stageRunner.ts:140-148`)
5. **Generate first trial** — `generateTrial(stage, usedSyllables)` creates Trial with correct answer + random incorrect options (`src/pages/StagePlayer.tsx:28-32` calls `src/engine/stageRunner.ts:54-112`)
6. **Display trial** — StagePlayer renders audio button and option buttons with nikud group labels (`src/pages/StagePlayer.tsx:94-129`)
7. **User selects answer** — `handleOptionSelect(groupId)` records selection (`src/pages/StagePlayer.tsx:35-59`)
8. **Record result** — `recordTrialResult(progress, result)` updates StageProgress with new trial result (`src/engine/stageRunner.ts:153-180`)
9. **Check mastery** — `checkMastery(progress)` evaluates if accuracy ≥ 80% after minimum 8 trials (`src/engine/stageRunner.ts:117-135`)
10. **Show feedback** — Display ✅ (correct) or ❌ (incorrect) popup, then show next button if not mastered (`src/pages/StagePlayer.tsx:131-155`)
11. **Generate next trial** — `handleNextTrial()` calls `generateTrial()` again with updated usedSyllables to avoid repeats (`src/pages/StagePlayer.tsx:61-69`)
12. **Loop or complete** — If mastered, show alert and freeze UI; otherwise loop to step 6

**State Management:**
- Component state in StagePlayer: `stage` (Stage), `progress` (StageProgress), `currentTrial` (Trial), `selectedOption` (string | null), `showFeedback` (boolean), `usedSyllables` (Set<string>)
- Immutable updates: New objects created with spread operators when recording results
- No global state or context providers — all state scoped to StagePlayer component

## Key Abstractions

**Trial:**
- Purpose: Represents a single question/audio syllable matching task
- Examples: `src/engine/stageRunner.ts:7-12`
- Pattern: Immutable data structure generated by `generateTrial()` with unique ID, correct answer, options, and audio syllable

**StageProgress:**
- Purpose: Track learner performance within a stage
- Examples: `src/engine/stageRunner.ts:28-34`
- Pattern: Accumulates trial results; counters updated with pure functions; mastery computed on-demand

**Stage:**
- Purpose: Define a learning unit with introduced and review content
- Examples: `src/content/stages.ts:18-49`
- Pattern: Immutable configuration; ordered progression from Stage 1 (sound "a") through Stage 5 (sound "u")

**NikudGroup:**
- Purpose: Represent a vowel mark with its phonetic properties and examples
- Examples: `src/content/nikudGroups.ts:6-44`
- Pattern: Immutable; contains label, member marks, and example syllables for audio generation

## Entry Points

**Web Entry:**
- Location: `src/main.tsx`
- Triggers: Page load
- Responsibilities: Mount React app to DOM element with id="root"

**Home Page:**
- Location: `src/pages/Home.tsx`
- Triggers: User navigates to `/` route
- Responsibilities: Display game title and start button; fetch first stage and navigate to `/stage/{id}`

**Stage Player Page:**
- Location: `src/pages/StagePlayer.tsx`
- Triggers: User navigates to `/stage/:stageId` or `/stage` routes
- Responsibilities: Render trial, capture user input, track progress, display feedback, check mastery

## Architectural Constraints

- **Client-side only** — No backend; all data and logic run in browser
- **Single-threaded event loop** — React component updates are serialized
- **No global state** — Each StagePlayer instance maintains its own progress; no cross-component data sharing
- **Immutable content** — Stages and nikud groups defined as const arrays; must not be mutated
- **URL as state** — Stage ID persisted in URL params; user can bookmark `/stage/stage-1` and resume
- **Set-based deduplication** — `usedSyllables` uses JavaScript Set for O(1) membership checks to prevent trial repetition

## Error Handling

**Strategy:** Fail-fast with descriptive errors

**Patterns:**
- Invalid stage ID: Fall back to `getFirstStage()` (`src/pages/StagePlayer.tsx:17`)
- Invalid nikud group: Throw error in `generateTrial()` if group not found (`src/engine/stageRunner.ts:74-76`)
- Missing trial: Render loading state "טוען..." if trial not yet generated (`src/pages/StagePlayer.tsx:71-73`)
- Mastery achieved: Display alert and freeze UI by disabling buttons (`src/pages/StagePlayer.tsx:54-58`)

## Cross-Cutting Concerns

**Logging:** Not implemented — no logging framework present. Errors thrown and caught by React error boundaries (if configured).

**Validation:** 
- TypeScript strict mode enforces type correctness at compile time
- Runtime validation: Check for falsy `stage` or `currentTrial` before rendering

**Authentication:** Not applicable — no user accounts or server integration

**Internationalization:**
- HTML lang="he" dir="rtl" for RTL text direction
- All UI text hardcoded in Hebrew (Hebrew-first design)
- Font: Google Assistant for Hebrew rendering

**Accessibility:**
- aria-label attributes on buttons (`src/pages/Home.tsx:19`, `src/pages/StagePlayer.tsx:96, 150`)
- Semantic button elements for keyboard navigation
- Text alternatives for audio content (feedback popups with emoji)

---

*Architecture analysis: 2026-07-11*
