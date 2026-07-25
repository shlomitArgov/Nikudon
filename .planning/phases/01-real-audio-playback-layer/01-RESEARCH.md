# Phase 1: Real Audio Playback Layer - Research

**Researched:** 2026-07-25
**Domain:** Web Audio API playback layer for a tap-triggered, kid-facing Hebrew phonics PWA (iOS Safari + Android tablet, offline-capable)
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Real recorded native-speaker clips are a production/content task outside this phase's build scope. For Phase 1 development and testing, use short placeholder clips (e.g. simple recorded or synthesized tones/beeps, or a temporary TTS stand-in) clearly named/located so they're trivially swappable later (e.g. a `placeholder` naming convention or subfolder).
- **D-02:** Only enough clips to validate the playback layer are needed in Phase 1 — one letter's worth (2 clips: "ah" + "ee" sound for a single representative letter) is sufficient to prove the mechanism end-to-end. Full recording inventory across all 22 letters is a later content-production concern, not a Phase 1 blocker.
- **D-03:** If a clip is missing or fails to load, fail soft: no harsh error dialog, no broken-looking UI. Log a console warning (dev-visible) and treat it gracefully in the UI (e.g. play button stays tappable, no crash). Exact fallback visual (retry icon vs. silent no-op) left to planner/executor discretion — not user-validated, revisit if it feels wrong in practice.
- **D-04:** No specific persona locked yet — defer to whoever produces the real recordings later. For Phase 1 placeholder purposes, any clear, neutral placeholder sound is fine.
- **D-05:** The `public/audio/` vs. `src/content/audio/` + `import.meta.glob` conflict (STACK.md vs. ARCHITECTURE.md) is left to the phase researcher/planner to resolve explicitly and document — not a user decision. **Resolved below, see "File Placement Decision (D-05)."**

### Claude's Discretion

This entire phase was scoped in "vibe mode" — the user asked to skip detailed discussion and let Claude make reasonable implementation calls, to be corrected later if wrong. Treat D-01 through D-04 above as low-confidence defaults, not firm requirements. The planner and executor should flag anything in CONTEXT.md that turns out to conflict with better information during planning/implementation rather than treating it as locked.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope (discussion itself was skipped by user request).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIO-01 | Child can tap a play button to hear a recorded native-speaker syllable clip for the current letter+sound | Web Audio API playback pattern (Standard Stack, Code Examples); placeholder-clip production method (Common Pitfalls / Assumptions) satisfies D-01/D-02 for this phase |
| AUDIO-02 | Child can replay the current sound by tapping again, with no lag on repeated taps | `AudioBufferSourceNode` one-shot-per-tap pattern + pre-decode-before-first-tap strategy (Architecture Patterns, Pitfall 2) |
| AUDIO-03 | Audio plays reliably on iOS Safari and Android tablets (tap-triggered playback works inside the installed PWA) | iOS synchronous-gesture-unlock pattern (Pitfall 1), Android autoplay-exemption findings (State of the Art), real-device verification gate (Environment Availability) |
| AUDIO-04 | One recorded clip exists per letter+sound-group, shared across sound-equivalent graphemes | Audio lookup keyed by `NikudGroupId` only (not by individual niqqud member/grapheme) — see Architecture Patterns, File Placement Decision |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **No reading required in UI** — the play button and any fallback affordance for a missing clip (D-03) must remain icon-only; no text error states.
- **Recorded audio required for production, no TTS** — applies to the eventual real content, not this phase's dev placeholders (D-01 explicitly permits TTS/tones as placeholders here).
- **Bidi text handling** — do not introduce Hebrew glyphs into filenames, module keys, or code identifiers for the audio layer (matches ARCHITECTURE.md's existing Anti-Pattern 4 guidance); keep all audio lookup keys ASCII (`NikudGroupId` values `'a' | 'e' | 'i' | 'o' | 'u'`).
- **`src/engine/` must stay pure/React-free** — no `AudioContext`/`Audio`/DOM access may leak into `stageRunner.ts`; audio playback code is isolated to a new `src/hooks/useAudioPlayer.ts`.
- **Naming conventions** — new files follow existing patterns: hook file `useAudioPlayer.ts` (camelCase function name), content module `audioAssets.ts` (camelCase, lookup-only, no side effects beyond the module-load glob), CSS untouched unless a fallback affordance requires new classes.
- **TypeScript strict mode** (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) — the hook and content module must compile clean under strict mode; see Pitfall 4 (TS glob typing gap) below, which is a concrete strict-mode blocker if not addressed.

## Summary

This phase replaces the `alert('Audio will play here')` stub at `src/pages/StagePlayer.tsx:96` with real Web Audio API playback. The project-level research (STACK.md, ARCHITECTURE.md, PITFALLS.md) already converged on the core technical choice — native Web Audio API (`AudioContext` + `decodeAudioData` + `AudioBufferSourceNode`), no library — and this phase-level research confirms and sharpens that guidance with three concrete resolutions the project-level research left open: (1) the `public/audio/` vs `src/content/audio/` + `import.meta.glob` placement conflict, (2) the exact synchronous-gesture-unlock implementation pattern for iOS Safari, and (3) how the audio lookup key should actually be shaped given this phase's explicit "one representative letter, two clips" scope (D-02) predates the letter-picker (Phase 3).

**Primary recommendation:** Use `src/content/audio/placeholder/{groupId}.mp3` (later `.wav`, see below) discovered via `import.meta.glob({ eager: true, query: '?url', import: 'default' })`, keyed by `NikudGroupId` alone (no letter dimension yet — that's Phase 3's job). Implement a module-level singleton `AudioContext`, resumed synchronously inside the play button's `onClick`, playing from `AudioBuffer`s pre-decoded during `StagePlayer`'s mount effect (not decoded on tap) so the very first tap — even before any prior interaction — has a ready buffer to play synchronously. No new npm dependencies. No `vite-plugin-pwa`/`vite.config.ts` changes are required — the existing `workbox.globPatterns` already covers `mp3` files wherever they land in the `dist/` build output.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tap-to-play trigger + gesture-unlock | Browser / Client | — | `AudioContext.resume()` must run synchronously inside a DOM event handler; this is inherently a client-only browser API concern |
| Audio asset resolution (`groupId` → URL) | Browser / Client | — | Pure lookup function in `src/content/`, runs entirely in the bundled client JS, no network round-trip at runtime beyond the initial asset fetch |
| Audio decode + buffer cache | Browser / Client | — | `decodeAudioData` and the resulting `AudioBuffer` cache live in a React hook (`useAudioPlayer.ts`), scoped to the browser tab's memory |
| Offline availability / precaching | CDN / Static | Browser / Client | Workbox (already configured) precaches the built `mp3` files into the service worker cache at install time; the browser's `fetch()` then resolves from that cache, not the network |
| Fail-soft missing-clip handling | Browser / Client | — | Presentation-layer concern (button stays tappable, `console.warn`); no backend/API tier exists in this client-only PWA |

This project has no Frontend-Server/SSR, API/Backend, or Database/Storage tier — it is a fully client-side PWA (per `PROJECT.md`'s existing "Client-side only" constraint), so this phase's capabilities collapse entirely into Browser/Client + CDN/Static (service worker precache), consistent with every other phase in this milestone.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Audio API (`AudioContext`, `decodeAudioData`, `AudioBufferSourceNode`) | Native browser API — no package version; available in all target browsers (iOS Safari, Android Chrome/WebView) [ASSUMED: inherited from project-level STACK.md, not re-verified this session] | Low-latency decode-once/play-many playback of short tapped syllable clips | Sidesteps the documented Safari `HTMLAudioElement` repeat-play delay bug; `AudioBufferSourceNode` is explicitly designed to be created fresh per playback from a shared decoded buffer [CITED: MDN `AudioBufferSourceNode`/`createBufferSource`, WebSearch cross-checked this session] |

No new runtime npm dependency is introduced by this phase — see Package Legitimacy Audit below (N/A, no packages).

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none)* | — | — | The use case (single short mono clip, one voice, tap-triggered) is fully covered by the native API; a library (Howler.js, `use-sound`) would add an unmaintained/stale dependency for no functional gain — see STACK.md "What NOT to Use" (inherited, not re-litigated here) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `AudioContext` + `AudioBuffer` (Web Audio API) | `HTMLAudioElement` (`new Audio()`) | Simpler API, but Safari has a documented repeat-`.play()` delay bug and unpredictable first-play latency — directly conflicts with AUDIO-02's "no lag on repeated taps" |
| `import.meta.glob`-discovered `src/content/audio/` files | Hand-maintained `public/audio/` + string paths | Both are equally well precached by the existing Workbox config (confirmed this session, see below); the glob approach costs nothing extra and gives forward-compatible auto-discovery once Phase 3 adds many more letters |
| Local `say`-generated Hebrew TTS placeholder clips | Silence/beep tones via an audio tool | `say -v Carmit` is confirmed installed and working on this dev machine [VERIFIED: executed `say -v Carmit -o test.wav ...` this session, produced a valid RIFF/WAVE file] and produces an actual Hebrew-syllable sound (closer to the real content than a pure tone), satisfying D-01/D-04 with zero new tooling |

**Installation:**
```bash
# No new runtime dependencies needed — Web Audio API is built into the browser.
# Nothing to add to package.json "dependencies" for audio playback.
```

**Version verification:** Not applicable — no npm package is being added or upgraded by this phase. `vite` (^5.0.8, resolved 5.4.21 locally [VERIFIED: `npx vite --version` executed this session]) and `vite-plugin-pwa` (^0.17.4) are unchanged; their existing versions already support everything this phase needs (`import.meta.glob`, `workbox.globPatterns`).

## Package Legitimacy Audit

**Not applicable — this phase installs no new packages.** All playback functionality uses the native browser Web Audio API and existing project dependencies (`vite`, `vite-plugin-pwa`, already-verified in project setup). No `npm install` step exists in this phase's plan.

## File Placement Decision (D-05)

**Decision: `src/content/audio/` + `import.meta.glob`, not `public/audio/`.**

### What was verified this session

Both STACK.md and ARCHITECTURE.md's underlying factual claims about Workbox precaching are correct, but the framing of "which one gets precached" was the point of confusion — **both do**, via the same mechanism:

- `workbox.globPatterns` (generateSW strategy, already configured in `vite.config.ts`) scans the **final `dist/` build output directory**, not `src/` or `public/` directly [CITED: vite-pwa-org.netlify.app static-assets guide, fetched this session via WebFetch].
- Vite copies `public/` contents into `dist/` verbatim (no hash) during build; `src/`-imported assets (including `import.meta.glob` matches) are bundled into `dist/assets/` with a content hash [CITED: WebSearch cross-checked against Vite's own asset-handling behavior, MEDIUM confidence].
- Because the project's existing `globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,ogg,woff,woff2}']` already includes `mp3`, **both placements are precached automatically with zero `vite.config.ts` changes** — this resolves the "how does precaching interact with placement" question this research was specifically tasked with answering.

### Why `src/content/audio/` wins anyway

Given precaching is a wash, the decision comes down to project fit:

1. **Consistency with the established content-layer pattern.** `letters.ts`, `nikudGroups.ts`, `stages.ts` all live in `src/content/` as the single source of truth for game content. Audio clips are content, not generic static assets (favicons, manifest icons) — keeping them alongside the rest of the content layer avoids a split "half the game data is in `src/content/`, half is in `public/`" mental model.
2. **Forward compatibility with Phase 3.** ARCHITECTURE.md already designed the eventual `{letterId}-{groupId}.mp3` naming convention + `import.meta.glob` auto-discovery pattern for the full 22-letter curriculum. Starting on `src/content/audio/` now means Phase 3 extends an existing pattern instead of migrating `public/audio/` string-path references into a glob-based system later.
3. **No practical downside at this scale.** The double-hashing/cache-busting concern STACK.md raised against `src/` assets is real in the abstract but irrelevant here: 2 files today, at most ~110 at full curriculum size — Vite's eager glob has no measurable cost at this scale (already noted as fine in ARCHITECTURE.md's own Scaling Considerations table).

### Concrete recommendation for this phase

```
src/content/audio/placeholder/
├── a.wav     # "ah" sound-group placeholder clip
└── i.wav     # "ee" sound-group placeholder clip
```

- **`placeholder/` subfolder** (not `placeholder-` filename prefix) — satisfies D-01's "trivially swappable" requirement: when real recordings arrive, the whole subfolder can be deleted/ignored by the glob pattern change, or the glob path simply changes from `./audio/placeholder/*` to `./audio/*` without touching any other code.
- **Filenames are the bare `NikudGroupId`** (`a.wav`, `i.wav`), not `{letterId}-{groupId}` — see "Audio Lookup Key Design" below for why introducing a fictional placeholder letter id is unnecessary complexity for this phase.
- **`.wav`, not `.mp3`**, for placeholder clips specifically — see Common Pitfalls/Assumptions Log for rationale (macOS `say` outputs WAV directly, no encoder dependency needed; `decodeAudioData` handles WAV natively in all target browsers). Real recordings later can be `.mp3` per STACK.md's guidance (smaller file size for dozens of real clips) — `vite.config.ts`'s `globPatterns` and this phase's `import.meta.glob('./audio/**/*.{wav,mp3}', ...)` should list both extensions so the transition requires no config change.

## Audio Lookup Key Design (resolves a gap in the project-level research)

D-02 scopes Phase 1 to "one letter's worth (2 clips)" while `Trial` (in `engine/stageRunner.ts`) currently has no `letterId` concept at all — letter selection doesn't exist until Phase 3 (per this phase's explicit boundary: "Does not include... the letter-picker screen"). This means ARCHITECTURE.md's designed `(letterId, groupId) → url` lookup signature cannot be implemented as-is in this phase without inventing a fictional placeholder letter.

**Recommendation:** For this phase, key audio purely by `NikudGroupId` (`getAudioUrl(groupId: NikudGroupId): string | undefined`), matching what `Trial.correctGroupId` already provides. This is not a workaround — it is factually correct for Phase 1's scope: since every trial currently uses the same (unspecified) letter regardless of which niqqud is being drilled, "one clip per sound" and "one clip per letter+sound" are indistinguishable until a real `letterId` exists. AUDIO-04 ("one clip per letter+sound-group, shared across sound-equivalent graphemes") is satisfied because the lookup is already keyed by `groupId` (not by individual niqqud member, so patach and kamatz share the `'a'` clip) — the "per letter" dimension is simply not yet a distinguishing axis in the data model, and adding it now would be speculative generality for a dimension Phase 3 will introduce with its own naming convention decision.

Document this explicitly in `audioAssets.ts`'s module comment so Phase 3's planner/executor understands why the signature will need to change, rather than silently discovering it.

## Architecture Patterns

### System Architecture Diagram

```
Child taps Play button (StagePlayer.tsx)
    │
    ▼
onClick handler (synchronous — no await before AudioContext work)
    │
    ├─▶ getAudioContext()  [module-level singleton, created lazily on first call]
    │        │
    │        ▼
    │    ctx.resume()   ── fire-and-forget, NOT awaited before next step
    │
    ├─▶ look up pre-decoded AudioBuffer for currentTrial.correctGroupId
    │        │
    │        ▼
    │    bufferCache: Map<NikudGroupId, AudioBuffer>  (populated by background preload below)
    │
    ├─▶ buffer ready?
    │      ├─ YES: stop() any still-playing previous source node
    │      │        → ctx.createBufferSource() → assign buffer → connect(ctx.destination) → start(0)
    │      └─ NO:  console.warn(...)  — fail soft (D-03): button stays tappable, no crash, no alert()

Background, on StagePlayer mount (useEffect — NOT gesture-gated, decode has no gesture requirement):
    for each NikudGroupId with a known audio URL (from content/audioAssets.ts):
        fetch(url)              → resolves instantly from Workbox precache (offline-capable)
        ctx.decodeAudioData(buf) → decode happens once, off the critical tap-latency path
        bufferCache.set(groupId, decodedBuffer)
```

A reader can trace the primary flow: tap → synchronous context resume → cached-buffer lookup → immediate playback, with the async decode work happening entirely *before* the tap, never *during* it — this is the structural fix for both AUDIO-02 (no lag) and AUDIO-03 (iOS gesture reliability).

### Recommended Project Structure

```
src/
├── content/
│   ├── audioAssets.ts          # NEW — pure (groupId) → URL lookup via import.meta.glob
│   └── audio/
│       └── placeholder/        # NEW — placeholder clips (D-01), trivially replaceable
│           ├── a.wav
│           └── i.wav
├── hooks/                      # NEW directory
│   └── useAudioPlayer.ts       # NEW — AudioContext singleton, preload/decode, play(groupId)
└── pages/
    ├── StagePlayer.tsx         # MODIFIED — replaces alert() stub with useAudioPlayer().play()
    └── StagePlayer.css         # possibly MODIFIED — only if a fail-soft visual affordance is added
```

### Pattern 1: Convention-over-configuration audio manifest via `import.meta.glob`

**What:** Build the `groupId → url` map automatically at module load from filenames under `src/content/audio/placeholder/`, instead of a hand-maintained object.

**When to use:** Any time new clips should be addable by dropping a file in, with zero code changes — directly useful once Phase 3 needs dozens of per-letter files.

**Example:**
```typescript
// src/content/audioAssets.ts
//
// Phase 1: audio is keyed by NikudGroupId only (one clip per sound, per AUDIO-04).
// Phase 3 (letter-picker) will extend this to (letterId, groupId) composite keys
// once per-letter recordings exist — see ARCHITECTURE.md Pattern 1 for that design.
import type { NikudGroupId } from './nikudGroups'

// Glob covers both formats so the placeholder→real-recording swap (wav→mp3)
// needs no code change, only a file swap.
const modules = import.meta.glob('./audio/placeholder/*.{wav,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const audioMap = new Map<string, string>()
for (const [path, url] of Object.entries(modules)) {
  const groupId = path.split('/').pop()!.replace(/\.(wav|mp3)$/, '')
  audioMap.set(groupId, url)
}

export function getAudioUrl(groupId: NikudGroupId): string | undefined {
  return audioMap.get(groupId)
}

export function getKnownGroupIds(): NikudGroupId[] {
  return [...audioMap.keys()] as NikudGroupId[]
}
```

### Pattern 2: `useAudioPlayer` hook — singleton `AudioContext`, preload-before-tap, fresh source node per play

**What:** One hook owns a module-level (not component-state) `AudioContext`, preloads/decodes all known clips on mount, and exposes a synchronous-safe `play(groupId)`.

**When to use:** Exactly this app's tap-to-hear/tap-to-replay UX — no scrubbing, no concurrent voices.

**Example:**
```typescript
// src/hooks/useAudioPlayer.ts
import { useEffect, useRef, useCallback, useState } from 'react'
import { getAudioUrl, getKnownGroupIds } from '../content/audioAssets'
import type { NikudGroupId } from '../content/nikudGroups'

// Module-level singleton — survives component remounts, respects Safari's
// documented cap on concurrently-open AudioContext instances.
let sharedContext: AudioContext | null = null
function getAudioContext(): AudioContext {
  if (!sharedContext) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    sharedContext = new Ctor()
  }
  return sharedContext
}

export function useAudioPlayer() {
  const bufferCache = useRef(new Map<NikudGroupId, AudioBuffer>())
  const currentSource = useRef<AudioBufferSourceNode | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Background preload/decode — NOT gesture-gated, runs on mount.
  useEffect(() => {
    let cancelled = false
    const ctx = getAudioContext()

    Promise.all(
      getKnownGroupIds().map(async (groupId) => {
        const url = getAudioUrl(groupId)
        if (!url) return
        try {
          const res = await fetch(url) // resolves from Workbox precache, offline-capable
          const arrayBuffer = await res.arrayBuffer()
          const decoded = await ctx.decodeAudioData(arrayBuffer)
          if (!cancelled) bufferCache.current.set(groupId, decoded)
        } catch (err) {
          // D-03: fail soft — log only, never throw/alert.
          console.warn(`[useAudioPlayer] failed to preload clip for "${groupId}"`, err)
        }
      })
    ).then(() => !cancelled && setIsReady(true))

    return () => {
      cancelled = true
    }
  }, [])

  const play = useCallback((groupId: NikudGroupId) => {
    const ctx = getAudioContext()
    // Synchronous, no await before this line — required for iOS unlock.
    void ctx.resume()

    const buffer = bufferCache.current.get(groupId)
    if (!buffer) {
      // D-03: fail soft — button stays tappable, no crash, no alert().
      console.warn(`[useAudioPlayer] no audio clip available for "${groupId}"`)
      return
    }

    // Stop any still-playing previous clip so rapid repeat taps sound clean,
    // not overlapping/garbled (supports AUDIO-02's "no lag on repeated taps").
    currentSource.current?.stop()

    const source = ctx.createBufferSource() // one-shot node — fresh instance per tap
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    currentSource.current = source
  }, [])

  return { play, isReady }
}
```

### Pattern 3: Wire into `StagePlayer.tsx`

**What:** Replace the `alert()` stub with a direct, synchronous call to `play(currentTrial.correctGroupId)`.

**Example:**
```typescript
// src/pages/StagePlayer.tsx (relevant excerpt)
import { useAudioPlayer } from '../hooks/useAudioPlayer'
// ...
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

### Anti-Patterns to Avoid

- **Decoding audio inside the tap handler:** Any `await` (fetch/decode) before the first `AudioContext.resume()`/`start()` call breaks iOS's synchronous-gesture requirement — decode must happen in a background effect before the tap, not during it (Pitfall 1/2).
- **Creating a new `AudioContext` per `StagePlayer` mount:** Route changes/remounts would leak contexts toward Safari's documented instance cap; use a module-level singleton (Pattern 2).
- **Reusing one `AudioBufferSourceNode` across multiple plays:** These nodes are one-shot — calling `.start()` twice throws `InvalidStateError`. Always `ctx.createBufferSource()` fresh per tap.
- **Keying audio by raw Hebrew grapheme strings** (e.g. `Trial.audioSyllable`, which is currently a glyph like `"בַּ"`): risks bidi/encoding bugs in filenames per PROJECT.md's constraint; key by the existing ASCII `NikudGroupId` instead (already the pattern `nikudGroups.ts` uses).
- **Inventing a placeholder `letterId` to match Phase 3's future naming convention:** adds a fictional dimension this phase's data model doesn't have yet (see "Audio Lookup Key Design" above) — keep the Phase 1 key `NikudGroupId`-only and document why.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Cross-browser audio "unlock" detection/polyfill | A custom feature-detection layer for "is audio unlocked yet" | The well-established synchronous-resume-in-gesture-handler pattern (Pattern 2 above) | This is a solved, narrow problem with one correct pattern across iOS/Android — a custom detection layer adds complexity without adding correctness |
| Offline audio caching / cache invalidation | Manual `caches.open()`/cache-busting logic for audio files | Existing `vite-plugin-pwa`/Workbox `globPatterns` precache (already configured, needs zero changes) | Workbox already handles content-hash-based invalidation for the exact file types (`mp3`, `ogg`) this phase adds; hand-rolling this would duplicate an already-working, already-tested mechanism |
| Audio playback library selection | A generic `AudioEngine` abstraction layer "in case we need more features later" | The ~50-line hook in Pattern 2 | YAGNI — this app has exactly one playback need (single-voice, tap-triggered, short clips); an abstraction layer for hypothetical future needs (crossfading, spatial audio) adds indirection with no current benefit, matching STACK.md's existing "no library" conclusion |

**Key insight:** Every piece of this phase's real complexity is timing (when does `resume()`/`decode()`/`start()` happen relative to the tap), not abstraction. Building more code here doesn't reduce risk — getting the *order of operations* right does.

## Common Pitfalls

### Pitfall 1: `import.meta.glob` type errors under TypeScript strict mode (no `vite-env.d.ts` exists yet)

**What goes wrong:** `tsc` (run as part of `npm run build`, per `package.json`'s `"build": "tsc && vite build"`) fails on `import.meta.glob(...)` with a type error, because Vite's ambient client types (`import.meta.glob`, `import.meta.env`, etc.) are not currently referenced anywhere in this codebase.

**Why it happens:** [VERIFIED: `ls src/` executed this session — no `src/vite-env.d.ts` file exists in this repository]. The standard Vite React+TS template normally includes this file by default; this project's scaffold appears to have omitted or removed it.

**How to avoid:** Add `src/vite-env.d.ts` containing `/// <reference types="vite/client" />` as a Wave 0 task, before writing `audioAssets.ts`. This is a one-line, zero-risk addition.

**Warning signs:** `tsc` build error referencing `import.meta.glob` or `import.meta.env` as "Property 'glob' does not exist on type 'ImportMeta'."

---

### Pitfall 2: First tap of a session plays nothing because the buffer isn't decoded yet

**What goes wrong:** If audio decoding is deferred until the first tap (rather than preloaded on mount), the tap handler must `await` the fetch+decode before calling `.start()` — and by the time that promise resolves, the browser may no longer consider the call to be "within" the original user gesture on iOS, silently blocking playback on exactly the first, most important tap of a session.

**Why it happens:** This is the specific mechanism behind the broader "iOS blocks audio outside a gesture" pitfall already documented in project-level PITFALLS.md — the subtlety is that `decodeAudioData` itself is async and gesture-agnostic (it doesn't need a gesture to run), so it should be moved entirely out of the tap handler and into a background effect that starts as soon as the component mounts, well before the child's first tap.

**How to avoid:** Preload/decode all known clips in a `useEffect` on `StagePlayer` mount (Pattern 2's `useAudioPlayer`), so the tap handler only ever does synchronous work: `resume()` → cache lookup → `createBufferSource()` → `start(0)`.

**Warning signs:** Audio works reliably on the second and later taps in a session but not the very first one — a strong signature of this exact race.

---

### Pitfall 3: `AudioBufferSourceNode` reuse throws `InvalidStateError`

**What goes wrong:** A tempting "optimization" is to create one `AudioBufferSourceNode` up front and call `.start()` on it repeatedly for each tap — this throws on the second call, since source nodes are single-use by spec.

**Why it happens:** Developers coming from `HTMLAudioElement` habits expect a reusable player object; `AudioBufferSourceNode` intentionally isn't one [CITED: MDN `AudioBufferSourceNode`, WebSearch cross-checked this session].

**How to avoid:** Always `ctx.createBufferSource()` fresh inside `play()`, reusing only the decoded `AudioBuffer` (which *is* reusable), never the source node itself.

**Warning signs:** `Uncaught DOMException: Failed to execute 'start' on 'AudioBufferSourceNode': cannot start an AudioBufferSourceNode more than once.`

---

### Pitfall 4: Placeholder clip generation depends on a macOS-only tool

**What goes wrong:** The recommended placeholder-generation method (`say -v Carmit`) only works on macOS. If a future contributor generates placeholder clips on Linux/Windows CI, the command won't exist.

**Why it happens:** `say` is a macOS system utility, not a cross-platform package [VERIFIED: `command -v say` and a live `say -v Carmit -o ... --data-format=LEI16@22050 "..."` invocation executed this session, produced a valid WAV file; `command -v ffmpeg` returned not-found on this machine].

**How to avoid:** This is a one-time, local content-authoring step (like ffmpeg normalization in STACK.md), not a build-time dependency — the *output* `.wav` files are what gets committed to the repo, not the generation command. Document the exact command used in a code comment or the phase's plan so it's reproducible on another macOS machine, but don't wire it into `npm run build`/CI.

**Warning signs:** None at runtime — this only matters if someone tries to regenerate placeholder clips on a non-macOS machine without an alternative tool.

## Code Examples

See Architecture Patterns → Pattern 1, 2, 3 above for the complete, verified-pattern code for `audioAssets.ts`, `useAudioPlayer.ts`, and the `StagePlayer.tsx` integration point.

### Generating the two placeholder clips (Wave 0, one-time local step)

```bash
# Run once on a macOS dev machine; commit the resulting .wav files.
mkdir -p src/content/audio/placeholder
say -v Carmit -o src/content/audio/placeholder/a.wav --data-format=LEI16@22050 "בַּ"
say -v Carmit -o src/content/audio/placeholder/i.wav --data-format=LEI16@22050 "בִּ"
```
[VERIFIED: this exact command form was executed this session against a scratch path and produced a valid `RIFF (little-endian) data, WAVE audio` file, ~17KB for one syllable]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `new Audio(url); audio.play()` for gameplay sounds | Web Audio API `AudioContext` + pre-decoded `AudioBuffer` + fresh `AudioBufferSourceNode` per play | Long-standing best practice for low-latency repeated playback (not a recent change) — reaffirmed this session via MDN/Chrome DevRel sources | Eliminates Safari's documented `<audio>` repeat-play delay and unpredictable first-play latency |
| Assuming installed PWAs always need the same gesture-unlock workaround as regular tabs | Android Chrome grants installed/home-screen PWAs an autoplay-with-sound exemption within manifest scope [CITED: Chrome for Developers autoplay policy blog, WebSearch cross-checked this session] | Ongoing Chrome policy, not new this session | Reduces cross-platform risk for Android specifically — this app doesn't rely on true autoplay anyway, so the exemption is a bonus, not a required workaround |

**Deprecated/outdated:** None specific to this phase — the Web Audio API surface used here (`AudioContext`, `decodeAudioData`, `createBufferSource`) is stable, unprefixed (except the `webkitAudioContext` fallback, relevant only for pre-2021 Safari versions, which are outside this project's realistic tablet-testing population).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Safari caps concurrently-open `AudioContext` instances at 4 | Common Pitfalls (Pattern 2 rationale) | Low — the singleton pattern recommended here avoids ever approaching this limit regardless of the exact number; if the real limit differs, the mitigation (one shared context) is still correct |
| A2 | iOS Safari 11.1+ / Android Chrome-WebView (all versions this project targets) support unprefixed `AudioContext` and `decodeAudioData` | Standard Stack (inherited from project-level STACK.md, not re-verified this session) | Low — real-device testing (this phase's own acceptance gate, AUDIO-03) will surface any actual gap immediately, since no fallback path exists for a browser without Web Audio API support |
| A3 | `.wav` placeholder clips will be reliably decoded by `decodeAudioData` on both target tablet browsers | File Placement Decision, Pitfall 4 | Low — WAV/PCM is a universally-supported baseline format with no proprietary codec dependency; if real-device testing shows otherwise, converting to `.mp3` via any audio tool is a same-day fix with no architecture change |

**If this table is empty:** N/A — see entries above. All three assumptions are LOW risk with clear, cheap recovery paths, none block starting the phase.

## Open Questions

1. **Exact fallback visual/interaction when a clip is missing (D-03 discretion point)**
   - What we know: must fail soft — no alert, no crash, button stays tappable, console warning logged.
   - What's unclear: whether the play button should visually indicate "no sound available" (e.g. a subtle dimmed state) or remain visually identical to the working state and simply do nothing on tap.
   - Recommendation: for Phase 1's actual scope (only stage-1's "a" group ever plays; stages 2-5 will hit missing-clip paths since D-02 only produces 2 clips total), keep the button visually identical and silently no-op — a dimmed/disabled-looking button for a child who can't read any explanatory text risks looking "broken" rather than "not yet available." Revisit if playtesting suggests otherwise, per D-03's explicit "revisit if it feels wrong" allowance.

2. **Whether `bufferCache`/preload should re-run per stage navigation or stay app-lifetime**
   - What we know: Phase 1 has only 2 total clips, so eager-preload-everything-once is trivially cheap.
   - What's unclear: nothing blocking for this phase; flagged only so Phase 3 (many more letters) doesn't inherit an unexamined "preload everything eagerly forever" assumption once the catalog grows to ~110 files.
   - Recommendation: no action needed this phase; ARCHITECTURE.md's own Scaling Considerations table already flags this as a Phase-3-or-later reassessment point.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Web Audio API (browser-native) | All of AUDIO-01–04 | ✓ (dev machine Chrome/Safari; assumed present on target tablets per A2) | N/A — native API | — |
| `say` (macOS TTS, for placeholder clip generation) | D-01 placeholder content production | ✓ [VERIFIED this session] | macOS system utility, Carmit (he_IL) voice confirmed installed | Any other WAV/MP3-producing tool (e.g. a phone voice memo export) works equally well — the format, not the generation tool, is what matters |
| `ffmpeg` | Not required this phase (STACK.md's normalization use case applies to *real* recordings, a later content-production task) | ✗ [VERIFIED: `command -v ffmpeg` not found this session] | — | Not needed for Phase 1; `say` covers placeholder generation without it |
| Real iPad (Safari) | AUDIO-03 acceptance gate | Unknown — cannot be probed from this shell; must be sourced by the user/tester | — | BrowserStack/similar cloud real-device testing service, or borrowed physical device, if no iPad is available at execution time |
| Real Android tablet (Chrome) | AUDIO-03 acceptance gate | Unknown — cannot be probed from this shell; must be sourced by the user/tester | — | Same as above — cloud device farm or borrowed physical device |
| `npm view` / registry checks | N/A — no new packages | N/A | — | — |

**Missing dependencies with no fallback:**
- None — every dependency above has a viable fallback path.

**Missing dependencies with fallback:**
- `ffmpeg` — not installed, not needed this phase (see above).
- Real iPad/Android tablet availability — cannot be verified from this environment; the plan must include an explicit real-device test task and treat "no device available" as a blocking question for the human, not silently skip the acceptance gate (per PITFALLS.md's standing "never ship audio without real-device testing" guidance).

## Security Domain

Per `.planning/config.json`, `security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | This is a fully client-side, single-user, no-login PWA (per PROJECT.md's "Client-side only" constraint); no auth surface exists anywhere in this app |
| V3 Session Management | No | No sessions/cookies; all state is component-local React state |
| V4 Access Control | No | No user roles or protected resources |
| V5 Input Validation | Marginal | The only "input" this phase introduces is `NikudGroupId`, a closed TypeScript union type (`'a' \| 'e' \| 'i' \| 'o' \| 'u'`) already validated at compile time by the existing `nikudGroups.ts` — no free-form user input reaches the audio lookup |
| V6 Cryptography | No | No secrets, tokens, or encrypted data involved in audio playback |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Arbitrary/attacker-controlled URL passed to `fetch()`/`decodeAudioData` | Tampering | Not applicable here — `audioMap` is built entirely from build-time-known, `import.meta.glob`-discovered literal URLs; there is no runtime path where a user-controlled or remote-origin string reaches `getAudioUrl()` or `fetch()` |

**Conclusion:** This phase has no meaningful ASVS-relevant attack surface — it is a static-asset-playback feature in a client-only app with no network input, no auth, and a closed-union lookup key. No security-specific tasks are required beyond normal code review.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection this session: `src/pages/StagePlayer.tsx`, `src/pages/Home.tsx`, `src/engine/stageRunner.ts`, `src/content/{nikudGroups,stages,letters}.ts`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`, `package.json` — confirms no `src/vite-env.d.ts` exists, no existing audio directory exists, `AudioContext`/DOM lib already configured in `tsconfig.json`
- Live command execution this session: `node --version`, `npm --version`, `npx vite --version`, `command -v ffmpeg` (not found), `command -v say` + `say -v '?'` (confirms Carmit he_IL voice) + a live `say -v Carmit -o ... --data-format=LEI16@22050 "בַּ"` producing a verified valid WAV file

### Secondary (MEDIUM confidence)
- [MDN: AudioBufferSourceNode / createBufferSource](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode) — WebSearch cross-checked this session, confirms one-shot-node-per-play pattern
- [MDN: Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — WebSearch this session, confirms `resume()`-in-gesture-handler pattern and singleton-context guidance
- [Matt Montag — Unlock JavaScript Web Audio in Safari and Chrome](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos) — WebSearch this session, corroborates synchronous-unlock pattern (also cited in project-level STACK.md)
- [Chrome for Developers — Autoplay policy in Chrome](https://developer.chrome.com/blog/autoplay) — WebSearch this session, confirms installed-PWA autoplay-with-sound exemption
- [vite-pwa-org.netlify.app — Static Assets guide](https://vite-pwa-org.netlify.app/guide/static-assets) — fetched via WebFetch this session, resolves the `public/` vs `src/` precaching mechanism question central to the D-05 decision
- Chromium blink-dev mailing list threads on Web Audio autoplay/gesture requirements — WebSearch this session, corroborates Android/Chrome gesture policy

### Tertiary (LOW confidence)
- None used directly this session — all Tertiary-tier claims were either upgraded to Secondary via cross-checking or omitted.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — inherits an already-cross-verified project-level conclusion (native Web Audio API, no library), re-confirmed this session against MDN/Chrome DevRel
- File placement decision (D-05): HIGH — resolved via a direct, session-verified read of the official vite-pwa static-assets guide, not left as a coin-flip between the two conflicting project-level docs
- Architecture/implementation pattern: HIGH — codebase-specific parts are direct inspection (HIGH); the gesture-unlock/preload-before-tap timing pattern is corroborated across 3+ independent sources this session
- Pitfalls: MEDIUM-HIGH — the TypeScript `vite-env.d.ts` gap and macOS-`say`-dependency pitfalls are project-specific findings verified by direct execution this session; the iOS-gesture pitfalls are inherited/re-confirmed, not novel
- Security: HIGH — straightforward "not applicable" conclusion for a client-only, no-auth, closed-union-input feature

**Research date:** 2026-07-25
**Valid until:** 30 days (stable browser API surface; re-verify if iOS/Android ship a materially different autoplay/gesture policy before execution)
