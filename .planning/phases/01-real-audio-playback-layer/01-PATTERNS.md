# Phase 1: Real Audio Playback Layer - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 6 (2 new, 1 new dir, 1 modified, 2 new asset files)
**Analogs found:** 4 / 6 (2 files have no direct analog — first of their kind in this codebase)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `src/vite-env.d.ts` | config | N/A (type declaration) | *(none — standard Vite scaffold file, missing from this repo)* | no-analog |
| `src/content/audioAssets.ts` | utility (content lookup) | file-I/O (glob → URL map) | `src/content/nikudGroups.ts` | role-match |
| `src/content/audio/placeholder/a.wav`, `i.wav` | asset (binary, not code) | file-I/O | *(none — first audio assets in repo)* | no-analog |
| `src/hooks/useAudioPlayer.ts` | hook | event-driven (tap → decode/play) | `src/engine/stageRunner.ts` (closest for pure-logic/state-transition shape) + `src/pages/StagePlayer.tsx` (closest for React state/effect shape) | partial-match (no existing hook exists; hybrid analog) |
| `src/pages/StagePlayer.tsx` | component (page) | request-response (tap → playback) | itself (existing file, modified) | exact (same file) |
| `src/pages/StagePlayer.css` | style | N/A | `src/pages/StagePlayer.css` (existing) | exact (same file, only touched if fallback affordance needs a class) |

## Pattern Assignments

### `src/content/audioAssets.ts` (utility, file-I/O lookup)

**Analog:** `src/content/nikudGroups.ts` (full file, 61 lines — already read in full above)

**Module structure pattern** (nikudGroups.ts lines 1-11):
```typescript
/**
 * Nikud sound-equivalence groups
 * Each group represents nikud signs that produce the same modern Hebrew sound
 */

export interface NikudGroup {
  id: string // 'a', 'e', 'i', 'o', 'u'
  label: string
  members: string[]
  exampleSyllables: string[]
}
```
Convention to copy: file opens with a JSDoc block describing the content module's purpose, followed by an exported interface/type, then the data/lookup construction, then exported accessor functions. `audioAssets.ts` should follow this shape: header comment (already drafted in RESEARCH.md explaining the Phase 1 `NikudGroupId`-only key decision), then the `import.meta.glob` map construction, then `getAudioUrl`/`getKnownGroupIds` exports.

**Accessor-function pattern** (nikudGroups.ts lines 48-60):
```typescript
/**
 * Get a nikud group by its ID
 */
export function getNikudGroup(id: NikudGroupId): NikudGroup | undefined {
  return nikudGroups.find((group) => group.id === id)
}

/**
 * Get all nikud group IDs
 */
export function getAllNikudGroupIds(): NikudGroupId[] {
  return nikudGroups.map((group) => group.id)
}
```
Copy this exact shape for `getAudioUrl(groupId): string | undefined` and `getKnownGroupIds(): NikudGroupId[]` — one-line JSDoc above each, `undefined`-returning lookup (never throws), named exports only (matches Module Design convention: "Named exports for utilities and data").

**Type re-export pattern** (nikudGroups.ts line 46):
```typescript
export type NikudGroupId = typeof nikudGroups[number]['id']
```
`audioAssets.ts` must `import type { NikudGroupId } from './nikudGroups'` (per RESEARCH.md Pattern 1) rather than redefining it — matches existing cross-module type-import convention seen in `stageRunner.ts` line 2 (`import { NikudGroupId, getNikudGroup, getAllNikudGroupIds } from '../content/nikudGroups'`).

**Full concrete implementation** is already fully specified in RESEARCH.md "Pattern 1" (verified against actual `import.meta.glob` API and cross-checked this session) — use it verbatim as the starting point, only conforming naming/comment style to the `nikudGroups.ts` conventions above.

---

### `src/hooks/useAudioPlayer.ts` (hook, event-driven)

**No existing hook file exists in this codebase** — `src/hooks/` is a brand-new directory. Closest analogs are two different files for two different aspects of the pattern:

**For the React state/effect shape** — analog `src/pages/StagePlayer.tsx` (full file, 161 lines — already read in full above):

Imports pattern (lines 1-13):
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
Convention to copy for `useAudioPlayer.ts`: named-hook imports from `'react'` at top, then relative imports from `../content/`, using `type` keyword for type-only imports mixed with value imports from the same module (matches "Type exports included in import statements" convention).

`useEffect` cleanup pattern (StagePlayer.tsx lines 27-33):
```typescript
useEffect(() => {
  if (stage) {
    const trial = generateTrial(stage, usedSyllables)
    setCurrentTrial(trial)
    setUsedSyllables((prev) => new Set(prev).add(trial.audioSyllable))
  }
}, [stage.id])
```
This is the only existing `useEffect` in the codebase; RESEARCH.md's Pattern 2 correctly extends this with a `cancelled` flag cleanup (not present in this simpler analog, but necessary here since the effect does async work) — that addition is justified and should be kept from RESEARCH.md's example, not omitted for "consistency."

Set-based dedup / accumulation pattern (StagePlayer.tsx lines 24, 31): `useState<Set<...>>(new Set())` updated immutably via `setX((prev) => new Set(prev).add(...))` — mirrors the `bufferCache`/bookkeeping style RESEARCH.md's hook uses (though RESEARCH.md correctly uses `useRef` for the buffer cache since it's not meant to trigger re-renders — a reasonable, justified deviation from the Set-in-state pattern here, not a plain copy).

**For the pure-function/error-handling shape** — analog `src/engine/stageRunner.ts` (full file, 181 lines — already read in full above):

Error/fallback pattern (stageRunner.ts lines 73-76):
```typescript
const correctGroup = getNikudGroup(correctGroupId)
if (!correctGroup) {
  throw new Error(`Invalid group ID: ${correctGroupId}`)
}
```
Note: `stageRunner.ts` throws on invalid input because it's a programmer-error case (invalid stage config), not a runtime content-availability case. **Do not copy the throw pattern for `useAudioPlayer.ts`** — D-03 explicitly requires fail-soft (`console.warn`, no throw) for missing/failed clips, which is a runtime content-availability case, not a programmer error. This distinction should be documented in the hook's code comments so future maintainers don't "fix" it to match stageRunner's stricter style.

Default-config-parameter pattern (stageRunner.ts lines 153-156):
```typescript
export function recordTrialResult(
  progress: StageProgress,
  result: TrialResult,
  config: MasteryConfig = DEFAULT_MASTERY_CONFIG
): StageProgress {
```
Not directly reusable in the hook (no equivalent config object needed for Phase 1's 2-clip scope), but establishes the project's convention of typed default parameters over hardcoded magic values — relevant if `useAudioPlayer` later grows an options parameter.

**CRITICAL constraint from CONTEXT.md/RESEARCH.md:** `src/engine/` must stay pure/React-free — `useAudioPlayer.ts` must NOT be placed in `src/engine/` and must NOT be imported by any file in `src/engine/`. It is intentionally a new `src/hooks/` directory, isolated from the engine layer.

---

### `src/pages/StagePlayer.tsx` (component, modified — request-response)

**Analog:** itself (existing file, lines 94-99 are the target of modification)

**Current stub to replace** (StagePlayer.tsx lines 94-99):
```typescript
<div className="audio-display">
  <button className="play-audio-button" onClick={() => alert('Audio will play here')} aria-label="Play audio">
    🔊
  </button>
</div>
```

**Replacement pattern** (from RESEARCH.md Pattern 3, consistent with existing event-handler naming convention `handleOptionSelect`/`handleNextTrial` — camelCase, `handle` prefix — seen at lines 35 and 61):
```typescript
const { play } = useAudioPlayer()
// ...
<button
  className="play-audio-button"
  onClick={() => play(currentTrial.correctGroupId)}
  aria-label="Play audio"
>
  🔊
</button>
```
Note: existing inline arrow-function `onClick` handlers (not extracted to named `handle*` functions) are used for simple one-line calls elsewhere in this same file only when trivial (e.g., `onClick={() => handleOptionSelect(groupId)}` at line 122) — `onClick={() => play(currentTrial.correctGroupId)}` matches this exact inline-simple-call style, so no `handlePlayAudio` wrapper function is needed unless additional logic (loading state, fallback UI) is added later.

**Hook usage placement:** add `const { play } = useAudioPlayer()` near the top of the component body, alongside the existing `useState`/`useParams` calls (StagePlayer.tsx lines 16-24), consistent with React's rules-of-hooks-at-top convention already followed in this file.

**Existing aria-label convention** (StagePlayer.tsx lines 96, 150) — preserve `aria-label="Play audio"` on the button; this is already present and should not be removed or changed.

---

## Shared Patterns

### Fail-soft error handling (no throw, no alert, console.warn only)
**Source:** RESEARCH.md D-03 requirement — no existing codebase analog (current codebase's only "error" precedent is `stageRunner.ts`'s `throw new Error(...)` at line 75, which is explicitly the WRONG pattern to copy here since it's a hard-fail for programmer error, not a soft-fail for missing content)
**Apply to:** `useAudioPlayer.ts`'s preload effect and `play()` function
```typescript
console.warn(`[useAudioPlayer] no audio clip available for "${groupId}"`)
```
No `alert()` calls in the new code — the one existing `alert()` at StagePlayer.tsx line 56 (`'🎉 כל הכבוד! סיימת את השלב!'`) is a deliberate UX choice for mastery celebration, unrelated to error handling, and must not be used as a precedent for the audio-missing case.

### Content module structure (JSDoc header + typed data + accessor functions)
**Source:** `src/content/nikudGroups.ts` (full file pattern, see above)
**Apply to:** `src/content/audioAssets.ts`

### camelCase file naming, named exports, no path aliases
**Source:** project-wide convention (CLAUDE.md Naming Patterns / Import Organization sections), confirmed present in every existing `src/content/*.ts` and `src/engine/stageRunner.ts` file
**Apply to:** all new files — relative imports with explicit `../` and file extensions, no `@/` aliases

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/vite-env.d.ts` | config | N/A | Standard Vite scaffold file; this repo's scaffold omitted it (confirmed via `ls src/` — no `vite-env.d.ts` present). No in-repo analog; use the standard one-line Vite template content: `/// <reference types="vite/client" />`. Required before `audioAssets.ts` compiles under strict mode (RESEARCH.md Pitfall 1). |
| `src/content/audio/placeholder/a.wav`, `i.wav` | asset (binary) | file-I/O | First audio/binary assets ever added to this repo; no code pattern to copy — these are generated via the `say -v Carmit` command documented in RESEARCH.md "Generating the two placeholder clips," not analogized from existing code. |
| `src/hooks/useAudioPlayer.ts` | hook | event-driven | No hook file exists anywhere in this codebase yet (confirmed — no `src/hooks/` directory exists). Treated as partial-match against `StagePlayer.tsx` (React state/effect shape) + `stageRunner.ts` (pure-function/error-handling shape, with the important caveat that its throw-on-error style must NOT be copied — see Pattern Assignments above). Use RESEARCH.md's Pattern 2 code as the primary implementation reference, adjusted only for naming/comment-style conformance to these two analogs. |

## Metadata

**Analog search scope:** `src/` (entire directory tree: `content/`, `engine/`, `pages/`, root-level `App.tsx`/`main.tsx`)
**Files scanned:** `src/pages/StagePlayer.tsx`, `src/content/nikudGroups.ts`, `src/content/stages.ts` (referenced via stageRunner import), `src/engine/stageRunner.ts`, `vite.config.ts`, directory listing of `src/` and `src/content/`
**Pattern extraction date:** 2026-07-25
