# Walking Skeleton — Nikudon

**Phase:** 1
**Generated:** 2026-07-25

## Capability Proven End-to-End

A child taps the on-screen play button in the drill and hears a real recorded Hebrew syllable clip — decoded via the native Web Audio API, served from the PWA precache — working from the very first tap of a session on a real tablet.

This is the thinnest slice that exercises the project's audio stack end-to-end. The React + TypeScript + Vite + PWA app shell already existed (prior commits); this skeleton adds the audio capability every later phase depends on. It replaces the `alert('Audio will play here')` stub in `StagePlayer.tsx` with the full asset -> manifest -> decode -> Web Audio -> tap path.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| App framework | React 18 + TypeScript (strict) + Vite 5 + vite-plugin-pwa (pre-existing scaffold) | Already in place; audio is added as an isolated layer, not a re-scaffold |
| Audio engine | Native Web Audio API — `AudioContext` + `decodeAudioData` + fresh `AudioBufferSourceNode` per play; NO library | Low-latency decode-once/play-many; sidesteps Safari's documented `HTMLAudioElement` repeat-play delay bug; zero new dependencies (RESEARCH Standard Stack) |
| Audio asset placement (D-05 resolved) | `src/content/audio/` discovered via `import.meta.glob({ eager: true, query: '?url', import: 'default' })`, NOT `public/audio/` string paths | Consistency with the established `src/content/` content layer; forward-compatible with Phase 3's per-letter catalog; both placements precache identically, so no downside (RESEARCH File Placement Decision) |
| Audio lookup key | `NikudGroupId` alone (`'a' \| 'e' \| 'i' \| 'o' \| 'u'`), NOT `(letterId, groupId)` | `letterId` does not exist in the data model until Phase 3; keying by `groupId` matches `Trial.correctGroupId` and satisfies AUDIO-04 (one clip per sound, shared across graphemes). Documented in `audioAssets.ts` for the Phase 3 planner to extend |
| Playback hook location | New `src/hooks/useAudioPlayer.ts`; module-level singleton `AudioContext` | `src/engine/` MUST stay pure/React-free — no `AudioContext`/DOM access leaks into the engine. A shared singleton context survives remounts and respects Safari's concurrent-context cap |
| iOS gesture unlock | `ctx.resume()` called synchronously (no preceding `await`) as the first line of the tap handler; all fetch/decode moved to a mount `useEffect` (preload-before-tap) | The only correct pattern for iOS Safari first-tap reliability; decoding on-tap breaks the gesture (RESEARCH Pitfall 1 & 2) |
| Missing-clip handling (D-03) | Fail soft: `console.warn`, button stays tappable, no throw, no alert, no broken UI | Runtime content-availability is not a programmer error — deliberately does NOT copy `stageRunner.ts`'s throw-on-invalid pattern |
| Offline caching | Existing vite-plugin-pwa / Workbox `globPatterns` (added `wav` token) | Workbox already precaches `mp3`/`ogg`; adding `wav` covers the placeholder clips so the installed PWA plays them offline. No hand-rolled cache logic |
| Dev placeholder clips (D-01/D-02/D-04) | Two `say -v Carmit` (he_IL) WAV clips at `src/content/audio/placeholder/{a,i}.wav` | Enough to prove the mechanism (one letter's worth: "ah" + "ee"); `placeholder/` subfolder makes the real-recording swap trivial; `.wav` avoids an encoder dependency |
| Deployment target | Local `npm run build` + LAN `preview` / HTTPS tunnel for real-device testing; no cloud deploy | Client-only PWA (PROJECT.md "Client-side only"); real-device acceptance is the milestone gate, not a hosted environment |

## Stack Touched in Phase 1

- [x] Project scaffold — pre-existing (React + TS + Vite + PWA); this phase adds `src/hooks/` and `src/content/audio/` and the `src/vite-env.d.ts` client-types file the scaffold omitted
- [x] Routing — pre-existing (`/stage/:stageId` reaches the drill where playback is wired); unchanged
- [x] Real read — `import.meta.glob` reads the placeholder clips; `fetch()` + `decodeAudioData` load and decode a real audio buffer at runtime
- [x] Real write — N/A for a client-only playback feature; the "write" analog is the Web Audio graph: `createBufferSource()` -> `connect(ctx.destination)` -> `start(0)` producing real audible output
- [x] UI — the drill play button is wired to `useAudioPlayer().play(currentTrial.correctGroupId)`, replacing the alert stub
- [x] Deployment / full-stack run — `npm run build && npm run preview -- --host` (LAN) plus an HTTPS tunnel for installed-PWA testing; verified on real iPad + Android tablet (plan 01-02)

## Out of Scope (Deferred to Later Slices)

Explicitly NOT in this skeleton — this list prevents later phases from re-litigating Phase 1's minimalism:

- Real recorded native-speaker clips and the full inventory across all 22 letters (content-production task; placeholders only here — D-01/D-02)
- A per-letter `(letterId, groupId)` audio key (Phase 3 introduces `letterId`)
- The letter-picker screen and back navigation (Phase 3)
- Any curriculum / trial-generation correctness fixes — distractor scoping, mastery boundary bug, Kamatz Katan exclusion (Phase 2)
- A chosen fallback VISUAL for a missing clip (dimmed/retry icon) — Phase 1 silently no-ops per RESEARCH Open Question 1; revisit only if playtesting shows it feels broken
- Voice/persona selection for real recordings (D-04, deferred to content production)
- A test runner / automated headless audio tests — not added (no runner exists; Web Audio is browser-only; RESEARCH says no new packages); behavioral proof is the real-device checkpoint
- Icon-only navigation, feedback tone, touch-target sizing, and visual polish (Phase 4)
- Progress persistence and the `matchTheMark` second mode (deferred to v2)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2:** Level-1 curriculum & trial-generation correctness — distractor scoping, random grapheme display, mastery-boundary fix, narrow content to one letter's "ah"/"ee", exclude Kamatz Katan. Consumes this audio path unchanged.
- **Phase 3:** Letter-picker screen — a child picks one of 22 consonants; extends `audioAssets.ts` from a `groupId`-only key to a `(letterId, groupId)` key using this skeleton's `import.meta.glob` pattern; adds back navigation.
- **Phase 4:** Icon navigation, feedback tone & visual polish — icon-only flow, warm/celebratory feedback (reusing the Web Audio path for feedback sounds), 64px touch targets, calm "cute" redesign, applied against the now-working screens.
