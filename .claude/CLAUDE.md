<!-- GSD:project-start source:PROJECT.md -->

## Project

**Nikudon**

Nikudon — Hebrew name: ניקודון — is a tablet-based, icon-only Hebrew niqqud (vowel-sign) learning game for pre-literate children ages 3-6. Kids already recognize the Hebrew alphabet and can identify the opening sounds of words, but can't yet read or sound out niqqud. In the game, a child picks a letter, hears a recorded syllable, and taps the matching niqqud symbol — no reading required, only universal icons (play, checkmark, X, back/return).

**Core Value:** A child who can't read should be able to play unassisted, guided purely by sound and universal icons, and correctly learn to associate niqqud symbols with their modern Hebrew sounds.

### Constraints

- **Audience**: Ages 3-6, pre-literate — all UI must be intuitable via universal icons and sound alone, no reading required
- **Platform**: Tablet-first, installable PWA, RTL Hebrew layout (already established in `index.html`/`vite.config.ts`)
- **Audio**: Must use real recorded native-speaker audio clips (not TTS) for pronunciation accuracy
- **Content correctness**: Niqqud sound-equivalence must be respected — never present two same-sound niqqud as competing distractor options in the same trial; Kamatz Katan excluded entirely from content
- **Bidi text handling**: Mixing Hebrew (RTL) and English (LTR) text — in docs, code comments, or UI — is prone to bidi-algorithm rendering bugs (e.g. reordering around punctuation/parentheses). Avoid inline Hebrew-in-parentheses within English sentences; prefer Hebrew on its own line/element, or wrap with explicit Unicode directional isolates (U+2067 RLI … U+2069 PDI) when inline mixing is unavoidable

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.2.2 - Application logic and type safety
- JavaScript (ES2020) - Generated output
- HTML5 - Markup with RTL support for Hebrew
- CSS3 - Styling with responsive design
- JSX (React) - Component syntax

## Runtime

- Node.js - Development and build time only
- Browser (Modern browsers with ES2020+ support) - Production runtime
- Service Workers - Offline functionality via Workbox
- npm 7.28.6+
- Lockfile: package-lock.json (present)

## Frameworks

- React 18.2.0 - UI library and component framework
- React DOM 18.2.0 - React rendering to DOM
- React Router DOM 6.20.0 - Client-side routing and navigation
- Vite 5.0.8 - Build tool and dev server
- @vitejs/plugin-react 4.2.1 - React support for Vite
- TypeScript 5.2.2 - Type checking and compilation
- vite-plugin-pwa 0.17.4 - PWA plugin for Vite
- workbox-window 7.0.0 - Service worker client library
- Workbox suite (via plugin) - Offline caching and service worker management

## Key Dependencies

- react 18.2.0 - Core UI framework
- react-dom 18.2.0 - DOM rendering
- react-router-dom 6.20.0 - Routing and navigation
- vite 5.0.8 - Build system and dev server
- vite-plugin-pwa 0.17.4 - Progressive Web App support with auto-updates
- workbox-window 7.0.0 - PWA runtime API
- typescript 5.2.2 - TypeScript compiler
- esbuild - Fast JavaScript bundler (used by Vite)
- terser - JavaScript minifier (used by Vite)
- rollup - Module bundler (used by Vite)
- eslint 8.55.0 - Code linting
- @typescript-eslint/eslint-plugin 6.14.0 - TypeScript linting rules
- @typescript-eslint/parser 6.14.0 - TypeScript parser for ESLint
- eslint-plugin-react-hooks 4.6.0 - React hooks linting
- eslint-plugin-react-refresh 0.4.5 - React refresh validation
- @types/react 18.2.43 - React type definitions
- @types/react-dom 18.2.17 - React DOM type definitions

## Configuration

- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Strict mode: enabled (noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch)
- Config: `tsconfig.json`, `tsconfig.node.json`
- Vite config: `vite.config.ts`
- Entry point: `index.html` with script module loading `src/main.tsx`
- Output: `dist/` directory (dist included in .gitignore)
- ESLint config: `.eslintrc.cjs`
- Rules: TypeScript ESLint recommended, React Hooks recommended, React Refresh warnings
- Parser: @typescript-eslint/parser
- Manifest: `public/manifest.webmanifest` and auto-generated in build
- Icons: 192x192 and 512x512 PNG files
- Name: Nikudon
- Display: standalone (native app-like appearance)
- Orientation: portrait
- Theme color: #ffffff

## Platform Requirements

- Node.js 18+ (implied from package setup)
- npm 7+
- Modern browser with ES2020 support
- Browser: Modern browsers with Service Worker support (Chrome 40+, Firefox 44+, Safari 11.1+, Edge 17+)
- Network: Optional - app works fully offline after initial install via PWA caching
- Storage: LocalStorage capability for client-side persistence
- RTL Support: HTML lang="he" dir="rtl" for Hebrew language and text direction
- Service Workers - Offline caching and background sync
- Web Manifest API - PWA installation
- LocalStorage - Client-side data persistence
- Web Audio API - For audio playback of Hebrew syllables
- Fetch API - For resource loading

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Components: PascalCase + `.tsx` (e.g., `Home.tsx`, `StagePlayer.tsx`)
- Utilities/Data: lowercase + `.ts` (e.g., `stages.ts`, `nikudGroups.ts`)
- CSS files: match component or utility name + `.css` (e.g., `StagePlayer.css`)
- Component functions: PascalCase (e.g., `Home`, `StagePlayer`, `App`)
- Utility functions: camelCase with descriptive verbs (e.g., `getStage()`, `generateTrial()`, `recordTrialResult()`, `checkMastery()`)
- Event handlers: `handle` prefix in camelCase (e.g., `handleStart()`, `handleOptionSelect()`, `handleNextTrial()`)
- State variables: camelCase (e.g., `stage`, `progress`, `currentTrial`, `selectedOption`)
- React hooks results: camelCase (e.g., `const navigate = useNavigate()`)
- Boolean flags: camelCase, often with `is`/`show` prefix (e.g., `isCorrect`, `showFeedback`, `isMastered`)
- Sets/Collections: plural or descriptive (e.g., `usedSyllables`, `allGroups`, `options`)
- Interfaces: PascalCase (e.g., `Stage`, `Trial`, `TrialResult`, `StageProgress`, `NikudGroup`, `MasteryConfig`)
- Type unions: PascalCase (e.g., `NikudGroupId`)
- Literal types: lowercase strings (e.g., `'hearAndTap' | 'matchTheMark'`)
- Configuration/Magic values: UPPER_CASE (e.g., `DEFAULT_MASTERY_CONFIG`)
- Readonly data arrays: camelCase (e.g., `stages`, `nikudGroups`)

## Code Style

- No explicit Prettier config found — follows default Prettier formatting
- Line length: Not enforced explicitly; naturally follows around 80-100 chars
- Semicolons: Included throughout
- Quotes: Single quotes in JavaScript, template literals for interpolation
- Trailing commas: Used in multi-line structures
- Tool: ESLint 8.55.0 with TypeScript support
- Key rules enforced:
- Target: ES2020
- Strict mode enabled: `strict: true`
- `noUnusedLocals: true` — all variables must be used
- `noUnusedParameters: true` — all parameters must be used
- `noFallthroughCasesInSwitch: true` — explicit switch cases required
- JSX: `react-jsx` (automatic runtime)
- Module resolution: `bundler`

## Import Organization

- Relative paths with explicit `../` (e.g., `../content/stages`)
- No path aliases configured
- File extensions included in imports (`.tsx`, `.ts`, `.css`)

## Error Handling

- Optional chaining: Used to safely access potentially undefined values (e.g., `stage.id || getFirstStage()`)
- Null/undefined checks: Explicit conditions before using values
- Error throwing: Used in edge cases (e.g., in `generateTrial()` when invalid group ID is provided):
- Fallback values: Nullish coalescing and ternary operators
- User feedback: `alert()` for completion notifications (e.g., `alert('🎉 כל הכבוד! סיימת את השלב!')`)
- Early returns: Used in event handlers to prevent state mutations

## Logging

- No centralized logging observed
- No explicit logging statements in source code
- Would use `console.log/warn/error` for debugging if needed

## Comments

- JSDoc blocks for interfaces, types, and exported functions (3-line comments above definition)
- Inline comments for complex logic or explaining "why" not "what"
- HTML comments in JSX for temporary notes or clarifications
- Used for all exported interfaces and data structures:
- Function documentation explains purpose and parameters implicitly through type annotations
- Examples from `src/content/stages.ts`:

## Function Design

- `getStage()`: 1 line (single find operation)
- `generateTrial()`: 58 lines (includes comments, main game logic)
- `recordTrialResult()`: 18 lines (state aggregation)
- `checkMastery()`: 10 lines (conditional logic)
- Explicit parameter types with TypeScript
- Optional parameters: marked with `?` and default assignments
- Collections passed as typed objects (e.g., `Set<string>`)
- Example from `generateTrial()`:
- Explicit return types on all exported functions
- Return objects/arrays for multi-value returns (no tuples)
- Example from `recordTrialResult()`:

## Module Design

- Named exports for utilities and data (e.g., `export function getStage()`)
- Default export for React components (e.g., `export default App`)
- Type exports included in import statements (e.g., `type Trial, type StageProgress`)
- One component per file (`Home.tsx`, `StagePlayer.tsx`)
- Data/logic separated: `content/` for data, `engine/` for game logic
- Clear separation of concerns:

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- **Functional React components** with hooks (useState, useEffect, useParams)
- **Immutable state management** using spread operators and new Set/Array construction
- **Pure functions** in the engine layer (stageRunner functions have no side effects)
- **Co-located styling** — CSS files paired with components in same directory
- **Content-first data modeling** — Game logic operates on well-defined domain objects (Stage, Trial, NikudGroup)

## Layers

- Purpose: Render UI, capture user input, display feedback
- Location: `src/pages/`
- Contains: React components (Home.tsx, StagePlayer.tsx) with hooks and event handlers
- Depends on: React Router (navigation), engine layer (trial generation), content layer (data)
- Used by: React entry point via Router
- Purpose: Client-side URL routing and navigation orchestration
- Location: `src/App.tsx`
- Contains: BrowserRouter, Routes, Route definitions
- Depends on: React Router DOM
- Used by: Main entry point
- Purpose: Trial generation, progress tracking, mastery detection, result recording
- Location: `src/engine/stageRunner.ts`
- Contains: Pure functions and TypeScript interfaces (Trial, StageProgress, TrialResult, MasteryConfig)
- Depends on: Content layer (Stage, NikudGroup interfaces)
- Used by: StagePlayer component
- Purpose: Define game domain objects and reference data
- Location: `src/content/`
- Contains: Immutable data arrays and lookup functions
- Depends on: TypeScript types only
- Used by: Engine layer, pages layer
- Purpose: Visual presentation and responsive layout
- Location: `src/` (index.css, App.css) and `src/pages/` (component-specific CSS)
- Contains: CSS with Flexbox layout, RTL support, mobile-first design
- CSS variables: `--spacing-lg`, `--spacing-xl`, `--color-primary`
- Used by: Components via className attributes

## Data Flow

### Primary Request Path: Start Game → Answer Question → Check Mastery

- Component state in StagePlayer: `stage` (Stage), `progress` (StageProgress), `currentTrial` (Trial), `selectedOption` (string | null), `showFeedback` (boolean), `usedSyllables` (Set<string>)
- Immutable updates: New objects created with spread operators when recording results
- No global state or context providers — all state scoped to StagePlayer component

## Key Abstractions

- Purpose: Represents a single question/audio syllable matching task
- Examples: `src/engine/stageRunner.ts:7-12`
- Pattern: Immutable data structure generated by `generateTrial()` with unique ID, correct answer, options, and audio syllable
- Purpose: Track learner performance within a stage
- Examples: `src/engine/stageRunner.ts:28-34`
- Pattern: Accumulates trial results; counters updated with pure functions; mastery computed on-demand
- Purpose: Define a learning unit with introduced and review content
- Examples: `src/content/stages.ts:18-49`
- Pattern: Immutable configuration; ordered progression from Stage 1 (sound "a") through Stage 5 (sound "u")
- Purpose: Represent a vowel mark with its phonetic properties and examples
- Examples: `src/content/nikudGroups.ts:6-44`
- Pattern: Immutable; contains label, member marks, and example syllables for audio generation

## Entry Points

- Location: `src/main.tsx`
- Triggers: Page load
- Responsibilities: Mount React app to DOM element with id="root"
- Location: `src/pages/Home.tsx`
- Triggers: User navigates to `/` route
- Responsibilities: Display game title and start button; fetch first stage and navigate to `/stage/{id}`
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

- Invalid stage ID: Fall back to `getFirstStage()` (`src/pages/StagePlayer.tsx:17`)
- Invalid nikud group: Throw error in `generateTrial()` if group not found (`src/engine/stageRunner.ts:74-76`)
- Missing trial: Render loading state "טוען..." if trial not yet generated (`src/pages/StagePlayer.tsx:71-73`)
- Mastery achieved: Display alert and freeze UI by disabling buttons (`src/pages/StagePlayer.tsx:54-58`)

## Cross-Cutting Concerns

- TypeScript strict mode enforces type correctness at compile time
- Runtime validation: Check for falsy `stage` or `currentTrial` before rendering
- HTML lang="he" dir="rtl" for RTL text direction
- All UI text hardcoded in Hebrew (Hebrew-first design)
- Font: Google Assistant for Hebrew rendering
- aria-label attributes on buttons (`src/pages/Home.tsx:19`, `src/pages/StagePlayer.tsx:96, 150`)
- Semantic button elements for keyboard navigation
- Text alternatives for audio content (feedback popups with emoji)

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
