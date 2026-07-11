# Architecture Research

**Domain:** Extending an existing content/engine/pages React+Vite PWA with an audio-asset layer and a new selection screen
**Researched:** 2026-07-11
**Confidence:** MEDIUM (grounded in direct codebase inspection = HIGH; audio-tooling specifics cross-checked against current Vite/vite-plugin-pwa docs = MEDIUM)

## Standard Architecture

### System Overview (extended)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                       React Router Layer (src/App.tsx)               │
│   /  →  /letters  →  /stage/:stageId/:letterId                       │
├───────────────┬────────────────────┬─────────────────────────────────┤
│   Home.tsx    │  LetterPicker.tsx  │  StagePlayer.tsx                │
│  (unchanged)  │  NEW               │  MODIFIED (consumes letterId)   │
└───────┬───────┴──────────┬─────────┴───────────────┬─────────────────┘
        │                  │                         │
        │                  ▼                         ▼
        │        ┌──────────────────┐   ┌─────────────────────────────┐
        │        │  hooks/           │   │  hooks/useAudioPlayer.ts    │
        │        │  (none needed —  │   │  NEW — React-side wrapper   │
        │        │  reads content)   │   │  around HTMLAudioElement    │
        │        └──────────────────┘   └───────────────┬─────────────┘
        │                                                │
        ▼                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Engine Layer — src/engine/stageRunner.ts          │
│  generateTrial(stage, letterId, usedSyllables)  ← MODIFIED signature │
│  • distractor pool now scoped to stage.introducedGroupId +           │
│    stage.reviewGroupIds (bug fix, was pulling from ALL groups)       │
│  • composes trial from letter+group via content-layer syllable      │
│    builder instead of nikudGroups' hardcoded exampleSyllables        │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Content Layer — src/content/                      │
│  • letters.ts       MODIFIED — add stable romanized `id` per letter  │
│  • nikudGroups.ts   unchanged (id/label/members = sound taxonomy)    │
│  • syllables.ts     NEW — pure fn: (letterId, groupId) → glyph       │
│  • audioAssets.ts   NEW — pure fn: (letterId, groupId) → audio URL,  │
│                      + getAvailableLetterIds() for the picker        │
│  • stages.ts        unchanged shape; level-1 data trimmed to a/i     │
├─────────────────────────────────────────────────────────────────────┤
│              Audio Files — src/content/audio/*.mp3                   │
│              (or src/assets/audio/*.mp3 — see rationale below)       │
│              discovered via import.meta.glob, NOT hand-registered    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `content/letters.ts` | Stable, filename-safe identity for each of the 22 consonants + their display glyph | `{ id: 'alef', glyph: 'א' }[]` — id is the audio/URL key, glyph is what nothing currently renders (icon-only UI) but engine still needs for composing syllable strings |
| `content/syllables.ts` (new) | Pure composition of a display/dedup string from a letter + a niqqud mark | `buildSyllable(letterId, markGlyph): string` — string concatenation of base letter + combining niqqud mark(s), same technique already used to hand-author `nikudGroups.exampleSyllables` |
| `content/audioAssets.ts` (new) | Single source of truth mapping `(letterId, groupId) → playable URL`, and which letters currently have recordings | Built once at module load via `import.meta.glob`, exposes `getAudioUrl()` and `getAvailableLetterIds()` — zero React, zero side effects beyond the glob itself |
| `hooks/useAudioPlayer.ts` (new) | React-side glue: owns one `HTMLAudioElement`, exposes `play(url)` / `replay()` / `isPlaying`, cleans up on unmount | `useRef<HTMLAudioElement>` + `useEffect` cleanup; consumes `audioAssets.ts`, never contains letter/niqqud domain logic itself |
| `engine/stageRunner.ts` | Trial generation and mastery tracking, now letter-aware and correctly scoped | `generateTrial(stage, letterId, usedSyllables)` — distractors drawn only from `[stage.introducedGroupId, ...stage.reviewGroupIds]`; syllable glyph + audio key derived via `content/syllables.ts` + `content/audioAssets.ts` |
| `pages/LetterPicker.tsx` (new) | Render the 22 (or fewer, if gated by recording availability) letters as tappable icon-only buttons; navigate to StagePlayer with the chosen letter | Functional component + co-located CSS, mirrors `Home.tsx`'s `useNavigate` pattern |
| `pages/StagePlayer.tsx` | Trial presentation, input handling, feedback — now also drives real audio playback and requires a `letterId` route param | Adds `useAudioPlayer` hook call; replaces the `alert('Audio will play here')` stub with `play(audioUrl)` |

## Recommended Project Structure

```
src/
├── content/                    # unchanged purpose: immutable data + pure lookups
│   ├── letters.ts              # MODIFIED: array of {id, glyph} objects, not bare strings
│   ├── nikudGroups.ts          # unchanged
│   ├── stages.ts                # unchanged shape; level-1 data restricted to a + i groups
│   ├── syllables.ts            # NEW: pure glyph-composition helper
│   ├── audioAssets.ts          # NEW: pure (letterId, groupId) → URL lookup, glob-built
│   └── audio/                  # NEW: the actual recorded clips
│       ├── alef-a.mp3
│       ├── alef-i.mp3
│       ├── bet-a.mp3
│       └── bet-i.mp3           # ...one file per (letter, sound-group) actually recorded
├── engine/
│   └── stageRunner.ts          # MODIFIED: generateTrial() takes letterId, fixed distractor scope
├── hooks/                      # NEW directory (anticipated but empty until now)
│   └── useAudioPlayer.ts       # NEW: HTMLAudioElement wrapper hook
└── pages/
    ├── Home.tsx                 # MODIFIED: navigate('/letters') instead of straight to a stage
    ├── LetterPicker.tsx         # NEW
    ├── LetterPicker.css         # NEW
    ├── StagePlayer.tsx          # MODIFIED: reads :letterId, uses useAudioPlayer
    └── StagePlayer.css          # unchanged
```

### Structure Rationale

- **`content/audio/` lives under `src/`, not `public/`:** Vite's `public/` directory is served verbatim with no build-time discovery — anything placed there must be manually referenced by a hand-maintained string path or list. Placing clips under `src/content/audio/` and discovering them with `import.meta.glob` gives two things `public/` can't: (1) automatic manifest generation — a content author drops in `bet-i.mp3` and it appears in the lookup with zero code changes, and (2) Vite's normal asset pipeline content-hashes the output filename, so workbox's existing `globPatterns: [...,'mp3','ogg',...]` precache (already configured in `vite.config.ts`) correctly busts the cache when a clip is re-recorded — `public/` assets don't get that hash and can go stale in an installed PWA's cache.
- **`content/syllables.ts` and `content/audioAssets.ts` are pure, no-React files, same as `stages.ts`/`nikudGroups.ts`:** keeps the content layer's existing "no functions except lookups, no side effects beyond the module-load glob" character intact. The engine layer keeps calling into content-layer getters exactly as it already does for `getNikudGroup`/`getAllNikudGroupIds` — this is additive, not a new pattern.
- **`hooks/` is a new top-level sibling of `content/`, `engine/`, `pages/`, not nested inside `pages/`:** `STRUCTURE.md` already anticipated this ("React hooks/helpers: could go in `src/pages/` or new `src/hooks/` directory (not yet created)"). A dedicated `hooks/` directory signals "React-specific glue" distinctly from `pages/` (route-bound screens) and keeps `useAudioPlayer` reusable if a future page (e.g. `matchTheMark`) also needs audio playback.
- **Letter ids, not Hebrew glyphs, are the addressable key everywhere (filenames, map keys, route params):** Hebrew glyphs are RTL and combine with niqqud diacritics — embedding them in filenames or URL path segments risks bidi-rendering and encoding bugs (already an explicit project constraint in `PROJECT.md`). A stable ASCII id (`alef`, `bet`, `gimel`, …) sidesteps this entirely and matches the existing convention of `nikudGroups[].id` being a plain ASCII sound code (`'a'`, `'e'`, `'i'`, `'o'`, `'u'`) rather than a niqqud glyph.

## Architectural Patterns

### Pattern 1: Convention-over-configuration audio manifest via `import.meta.glob`

**What:** Instead of a hand-maintained `{ letterId: { groupId: url } }` object that every content author edits, build the map automatically at module load from filenames matching `{letterId}-{groupId}.mp3` under `src/content/audio/`.

```typescript
// src/content/audioAssets.ts
const modules = import.meta.glob('./audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

// keys look like './audio/alef-a.mp3' -> derive letterId/groupId from the filename
const audioMap = new Map<string, string>() // key: `${letterId}-${groupId}`
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split('/').pop()!.replace('.mp3', '')
  audioMap.set(filename, url)
}

export function getAudioUrl(letterId: string, groupId: string): string | undefined {
  return audioMap.get(`${letterId}-${groupId}`)
}

export function getAvailableLetterIds(requiredGroupIds: string[]): string[] {
  // a letter is "pickable" only if it has recordings for every group the
  // current level needs (e.g. both 'a' and 'i' for level 1)
  const ids = new Set<string>()
  for (const key of audioMap.keys()) {
    const letterId = key.slice(0, key.lastIndexOf('-'))
    ids.add(letterId)
  }
  return [...ids].filter((id) =>
    requiredGroupIds.every((g) => audioMap.has(`${id}-${g}`))
  )
}
```

**When to use:** Any time content authors (who may not be comfortable editing TypeScript) need to add assets without a developer touching a registration file. Ideal here because the milestone explicitly wants "content authors can add more letters/sounds later without code changes."
**Trade-offs:** Requires files to be under `src/` (bundled at build time) rather than `public/`; glob is eager (loads all URLs into memory at startup) which is trivial at this scale (≤22 letters × handful of groups × mp3 URL strings) but would need revisiting (lazy/dynamic glob) if the catalog grew into the hundreds.

### Pattern 2: Thin React hook wrapping a single `HTMLAudioElement`

**What:** One hook owns exactly one `Audio` instance, exposes `play(url)`/`replay()`, and tears it down on unmount.

```typescript
// src/hooks/useAudioPlayer.ts
import { useRef, useCallback, useEffect, useState } from 'react'

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(url)
    audioRef.current = audio
    audio.addEventListener('ended', () => setIsPlaying(false))
    setIsPlaying(true)
    void audio.play()
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  return { play, isPlaying }
}
```

**When to use:** Single-clip, trigger-and-play UX (tap play icon → hear syllable; tap replay → hear it again) — exactly this app's need. No scrubbing, seeking, or playlist state, so a full audio-player library is unwarranted overhead.
**Trade-offs:** Doesn't handle overlapping/concurrent clips (a new `play()` call cuts off the previous one) — correct behavior for this UI (one syllable at a time) but would need a pooled-instance approach if the app ever layered sound effects over speech.

### Pattern 3: Keep `Stage` (sound scope) and letter selection (runtime parameter) orthogonal

**What:** `Stage` in `content/stages.ts` continues to describe *which niqqud sound-groups* are in play (`introducedGroupId`, `reviewGroupIds`) — it does not know about letters. Which letter the child is drilling is a *runtime* choice from `LetterPicker`, threaded through the route (`/stage/:stageId/:letterId`) and passed as an explicit argument into `generateTrial(stage, letterId, usedSyllables)`.

**When to use:** Whenever a piece of state is chosen per-session by the user rather than fixed by content design — keeping it out of the static content array avoids combinatorial explosion (22 letters × 5 stages ≠ new Stage objects) and keeps `stages.ts` a small, hand-authored curriculum file, matching its current "no functions except lookup helpers" character.
**Trade-offs:** `generateTrial`'s signature changes (adds a required `letterId` param) — every call site must be updated; this is a one-time, mechanical migration (`StagePlayer.tsx`'s two call sites).

## Data Flow

### Audio lookup flow (new)

```
Child taps a letter on LetterPicker
    ↓
navigate(`/stage/${stageId}/${letterId}`)
    ↓
StagePlayer reads :stageId, :letterId from useParams()
    ↓
generateTrial(stage, letterId, usedSyllables)          [engine/stageRunner.ts]
    ↓ picks correctGroupId (scoped to stage's own groups — bug fix)
    ↓ calls content/syllables.ts → glyph string (for dedup Set + potential future display)
    ↓ calls content/audioAssets.ts → getAudioUrl(letterId, correctGroupId)
    ↓
Trial { id, correctGroupId, options, letterId, audioUrl }
    ↓
StagePlayer renders play button
    ↓ user taps play/replay icon
useAudioPlayer().play(trial.audioUrl)                   [hooks/useAudioPlayer.ts]
    ↓
new Audio(url).play()  → browser plays cached/precached mp3
```

### Key Data Flows

1. **Letter selection → trial generation:** `LetterPicker` is purely a navigation trigger (no engine calls); it reads `content/letters.ts` (and, once wired, filters via `audioAssets.getAvailableLetterIds()`) to decide what's tappable, then hands off `letterId` via the URL — consistent with the existing "URL as state" constraint (bookmarkable `/stage/:stageId`, now `/stage/:stageId/:letterId`).
2. **Trial → audio playback:** Engine layer never touches `HTMLAudioElement` or React — it only returns a resolved `audioUrl` string (or the hook receives `letterId`+`correctGroupId` and resolves the URL itself via `content/audioAssets.ts`, if you'd rather keep `Trial` free of audio concerns entirely). Either placement keeps the engine pure and testable without a DOM; the audio side effect stays confined to `hooks/useAudioPlayer.ts` and the one call site in `StagePlayer.tsx`.
3. **Distractor scoping fix:** `generateTrial` must build its incorrect-options pool from `[stage.introducedGroupId, ...stage.reviewGroupIds]` (the `allGroups` variable already computed but currently unused for this purpose) instead of `getAllNikudGroupIds()`. For level 1 (`stage.introducedGroupId: 'a'`, later `reviewGroupIds: ['a']` when 'i' is introduced), this collapses the option pool to exactly the two in-scope sounds — matching "only ah + ee for one letter" from the milestone.

## Scaling Considerations

This is a small, offline-first, single-user PWA — "scale" here means catalog size (letters × sounds recorded), not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Level 1 (1 sound-pair, ~22 letters × 2 clips = ~44 files) | `import.meta.glob({ eager: true })` is fine — everything loads at startup, total payload is trivial |
| Full curriculum (22 letters × 5 groups ≈ 110 clips) | Still fine eager; total audio asset weight (~a few MB of short mp3s) is well under typical `maximumFileSizeToCacheInBytes` per-file limits, but worth checking workbox's *aggregate* precache size warning once the full catalog exists |
| Hypothetical multi-word/sentence audio later | Would justify switching the glob to lazy (`eager: false`) and fetching URLs on demand rather than precaching everything, and introducing a loading state in `useAudioPlayer` |

### Scaling Priorities

1. **First (and likely only) concern for this milestone:** total precache size once ~44 short clips are added — verify `workbox.globPatterns`/`maximumFileSizeToCacheInBytes` in `vite.config.ts` still covers the new `src/content/audio/**/*.mp3` output paths after a build (glob output lands in `dist/assets/`, already matched by the existing `mp3` pattern).
2. **Second (deferred):** if/when curriculum expands to all 5 sound-groups × 22 letters, reassess eager-glob memory footprint — still almost certainly fine for ~110 short clips, but worth a build-size sanity check.

## Anti-Patterns

### Anti-Pattern 1: Hand-maintained `{ letterId: { groupId: url } }` object literal that must be edited per new recording

**What people do:** Add a new letter/sound by writing a new key into a big exported JS object alongside the file drop.
**Why it's wrong:** Directly contradicts the stated goal ("content authors can add more letters/sounds later without code changes") and is an easy source of typo bugs (mismatched id between the object and the actual filename).
**Do this instead:** `import.meta.glob` + filename convention (Pattern 1 above) — the filename *is* the registration.

### Anti-Pattern 2: Baking `letterId` into `Stage` content objects

**What people do:** Add `letterId: 'alef'` directly onto each `Stage` in `stages.ts`, creating `stage-1-alef`, `stage-1-bet`, etc.
**Why it's wrong:** Explodes the content array combinatorially (stages × letters) for something that's actually a runtime user choice, breaks the existing `getNextStage()` progression logic, and mixes "what sound is being taught" (content-authored) with "which letter is the child drilling right now" (session-chosen) into one object.
**Do this instead:** Keep `Stage` letter-agnostic; thread `letterId` as a separate runtime parameter (route param → engine function argument), per Pattern 3.

### Anti-Pattern 3: Letting `HTMLAudioElement`/`Audio()` leak into `content/` or `engine/`

**What people do:** Call `new Audio(url).play()` directly from inside `generateTrial()` or a content-layer helper "since it's convenient."
**Why it's wrong:** Breaks the existing, explicitly-documented invariant that the engine layer is pure (no side effects, no DOM) and the content layer has "no functions except lookup helpers" — this is what currently makes `stageRunner.ts` easy to unit-test without a browser. Audio playback is a browser-only side effect and belongs strictly in the presentation layer.
**Do this instead:** Engine/content only ever resolve and return a URL string; the one place that ever touches `Audio` is `hooks/useAudioPlayer.ts`, called from `pages/StagePlayer.tsx`.

### Anti-Pattern 4: Keying audio files by raw Hebrew glyphs

**What people do:** Name files `בַּ.mp3`, `אָ.mp3`, etc., matching the glyph strings already in `nikudGroups.exampleSyllables`.
**Why it's wrong:** Hebrew filenames mix RTL text into build tooling, URLs, and git history, and niqqud marks are combining Unicode characters that can be visually indistinguishable or fail to round-trip through certain filesystems/tools — high risk of exactly the bidi/encoding bugs already flagged as a project-wide constraint in `PROJECT.md`.
**Do this instead:** ASCII `{letterId}-{groupId}` keys (`alef-a.mp3`), matching the existing ASCII convention already used for `nikudGroups[].id`.

## Integration Points

### External Services

None — this remains a fully client-side PWA with no backend, matching the existing "Client-side only" architectural constraint. Audio assets are bundled/precached, not fetched from a remote API.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `pages/LetterPicker.tsx` ↔ `content/letters.ts` + `content/audioAssets.ts` | Direct function calls (`letters`, `getAvailableLetterIds()`) | Same pattern as `Home.tsx` calling `getFirstStage()` today — no new abstraction needed |
| `pages/StagePlayer.tsx` ↔ `engine/stageRunner.ts` | Direct function calls, now passing `letterId` | Existing call pattern, signature grows by one required argument |
| `engine/stageRunner.ts` ↔ `content/syllables.ts`, `content/audioAssets.ts` | Direct function calls | Mirrors existing `stageRunner.ts` → `content/nikudGroups.ts` dependency |
| `pages/StagePlayer.tsx` ↔ `hooks/useAudioPlayer.ts` | React hook call | New boundary; hook is the *only* place `HTMLAudioElement` is instantiated |
| `App.tsx` route params ↔ `pages/*` | `useParams<{ stageId, letterId }>()` | Extends the existing "URL as state" pattern; both ids become bookmarkable/shareable |

## Sources

- [Vite: Static Asset Handling](https://vite.dev/guide/assets) — official docs on `public/` vs imported assets, `import.meta.glob` behavior (MEDIUM confidence, cross-checked against project's own `vite.config.ts`)
- [Vite PWA: Service Worker Precache guide](https://vite-pwa-org.netlify.app/guide/service-worker-precache) — confirms `workbox.globPatterns` must explicitly list non-JS/CSS/HTML asset extensions (e.g. `mp3`) to be precached; project's `vite.config.ts` already includes `mp3,ogg` (MEDIUM confidence, self-consistent with existing config)
- Direct codebase inspection: `src/content/{letters,nikudGroups,stages}.ts`, `src/engine/stageRunner.ts`, `src/pages/{Home,StagePlayer}.tsx`, `src/App.tsx`, `vite.config.ts`, `package.json` (HIGH confidence — primary source)
- General React community pattern survey (custom `useAudio`/`usePlaySound` hooks wrapping `HTMLAudioElement` with ref + unmount cleanup) — search results converged across multiple independent sources (dev.to, LogRocket, letsbuildui.dev) (MEDIUM confidence)

---
*Architecture research for: Hebrew niqqud phonics PWA — audio-asset layer + letter-picker extension*
*Researched: 2026-07-11*
