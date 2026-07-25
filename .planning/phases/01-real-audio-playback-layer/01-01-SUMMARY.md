---
phase: 01-real-audio-playback-layer
plan: 01
subsystem: audio
tags: [web-audio-api, vite, import.meta.glob, pwa, workbox]

# Dependency graph
requires: []
provides:
  - Vite client type declarations enabling import.meta.glob under strict mode
  - Two placeholder WAV clips (a.wav "ah", i.wav "ee") keyed by NikudGroupId
  - src/content/audioAssets.ts — groupId -> URL manifest built from import.meta.glob
  - src/hooks/useAudioPlayer.ts — singleton AudioContext, preload-on-mount, tap-to-play hook
  - StagePlayer play button wired to real Web Audio playback (alert() stub removed)
  - vite.config.ts Workbox globPatterns precaches .wav for offline PWA use
affects: [01-02, 03-letter-picker]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Content-module lookup via import.meta.glob (eager, ?url) mirrors nikudGroups.ts content-layer shape"
    - "Module-level singleton AudioContext with preload-before-tap decode, synchronous resume() inside the tap handler (iOS unlock), fresh AudioBufferSourceNode per play"
    - "Fail-soft (console.warn, never throw/alert) for missing/failed audio content, explicitly distinguished from stageRunner.ts's throw-on-programmer-error pattern"

key-files:
  created:
    - src/vite-env.d.ts
    - src/content/audio/placeholder/a.wav
    - src/content/audio/placeholder/i.wav
    - src/content/audioAssets.ts
    - src/hooks/useAudioPlayer.ts
  modified:
    - vite.config.ts
    - src/pages/StagePlayer.tsx
    - src/engine/stageRunner.ts

key-decisions:
  - "Audio keyed by NikudGroupId only (not letterId) — Phase 3 will extend to a composite key once per-letter recordings exist"
  - "Placeholder clips generated via macOS `say -v Carmit` as WAV/PCM, committed under src/content/audio/placeholder/ for trivial later swap to real recordings"

patterns-established:
  - "src/hooks/ is a new, engine-isolated directory for React-audio integration — src/engine/ stays pure/React-free"

requirements-completed: [AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04]

coverage:
  - id: D1
    description: "Tapping the play button plays a real Web Audio clip instead of an alert() dialog"
    requirement: AUDIO-01
    verification:
      - kind: other
        ref: "npm run build (tsc strict + vite build) confirms play(currentTrial.correctGroupId) wired; grep confirms 'Audio will play here' stub removed"
        status: pass
    human_judgment: true
    rationale: "Audible playback and tap-feel can only be confirmed by a human listening on a real device — desktop build proves the code path compiles and wires correctly, but not that sound is actually heard. This is explicitly deferred to plan 01-02's real-device acceptance checkpoint per the plan's Nyquist note."
  - id: D2
    description: "Repeat taps replay cleanly via a fresh AudioBufferSourceNode per call, with the previous source stopped first, and no lag because buffers are preloaded/decoded on mount rather than on tap"
    requirement: AUDIO-02
    verification:
      - kind: other
        ref: "grep confirms createBufferSource/decodeAudioData present in src/hooks/useAudioPlayer.ts; preload runs in useEffect on mount, not in play()"
        status: pass
    human_judgment: true
    rationale: "Perceived lag/no-lag on repeated taps is a timing/UX judgment that requires a human to actually tap repeatedly and listen — deferred to plan 01-02's device checkpoint."
  - id: D3
    description: "Synchronous ctx.resume() inside the tap handler (no await before it) plus wav precache glob support iOS/Android/installed-PWA gesture-unlock reliability"
    requirement: AUDIO-03
    verification:
      - kind: other
        ref: "grep confirms non-awaited 'resume' call in useAudioPlayer.ts play(); vite.config.ts globPatterns includes wav"
        status: pass
    human_judgment: true
    rationale: "AUDIO-03 is explicitly a blocking real-device acceptance gate owned by plan 01-02 (iPad Safari + Android tablet); this plan only builds and desktop-verifies the code path per the plan's own Nyquist note."
  - id: D4
    description: "Two placeholder clips (a, i) keyed by NikudGroupId share one clip per sound-group across sound-equivalent graphemes (patach/kamatz both resolve to 'a')"
    requirement: AUDIO-04
    verification:
      - kind: other
        ref: "file src/content/audio/placeholder/{a,i}.wav reports WAVE; audioAssets.ts getAudioUrl keyed by NikudGroupId (patach and kamatz share group id 'a' in nikudGroups.ts)"
        status: pass
    human_judgment: false
  - id: D5
    description: "npm run build and npm run lint pass clean under TypeScript strict mode, including the import.meta.glob call"
    verification:
      - kind: other
        ref: "npm run build exit 0; npx eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0 exit 0 (re-confirmed after reconnect)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-25
status: complete
---

# Phase 1 Plan 1: Real Audio Playback Layer — Foundation Summary

**Tap-to-hear Web Audio playback wired end-to-end: import.meta.glob-discovered placeholder clips, singleton AudioContext with preload-before-tap decode and synchronous iOS-unlock resume, replacing the alert() stub in StagePlayer.**

## Performance

- **Duration:** ~6 min (first commit 13:48:27 to last commit 13:53:46 local time)
- **Started:** 2026-07-25T10:48:27Z
- **Completed:** 2026-07-25T10:53:46Z
- **Tasks:** 3/3
- **Files modified:** 8 (5 created, 3 modified)

## Accomplishments
- Added `src/vite-env.d.ts` so `import.meta.glob` type-checks under TypeScript strict mode
- Generated two placeholder Hebrew syllable clips (`a.wav`, `i.wav`) via macOS `say -v Carmit`, committed under `src/content/audio/placeholder/`
- Built `src/content/audioAssets.ts`: an `import.meta.glob`-based manifest mapping `NikudGroupId` -> clip URL, with a documented Phase-3 extension note for the future `(letterId, groupId)` composite key
- Built `src/hooks/useAudioPlayer.ts`: a module-level singleton `AudioContext`, preload/decode-all-clips-on-mount, and a `play(groupId)` that resumes the context synchronously (iOS unlock), stops any still-playing source, and starts a fresh `AudioBufferSourceNode` per tap — fails soft (`console.warn`) on any missing/failed clip
- Wired the hook into `StagePlayer.tsx`: the play button's `onClick` now calls `play(currentTrial.correctGroupId)`, and the English `alert('Audio will play here')` stub is gone (the unrelated Hebrew mastery-celebration `alert()` is untouched)
- Added `wav` to `vite.config.ts`'s Workbox `globPatterns` so the placeholder clips precache for offline PWA testing

## Task Commits

Each task was committed atomically:

1. **Task 1: Foundation — Vite client types, placeholder clips, and wav precache glob** - `916630d` (feat)
2. **Task 2: Audio manifest (audioAssets.ts) and playback hook (useAudioPlayer.ts)** - `4afa691` (feat, includes a Rule 3 blocking-fix in stageRunner.ts)
3. **Task 3: Wire the hook into StagePlayer — remove the alert stub** - `eb3904a` (feat, includes Rule 3 blocking-fixes in StagePlayer.tsx)

**Plan metadata:** committed as part of this summary/state update.

## Files Created/Modified
- `src/vite-env.d.ts` - Vite client ambient types (enables `import.meta.glob`)
- `src/content/audio/placeholder/a.wav` - placeholder "ah" sound-group clip
- `src/content/audio/placeholder/i.wav` - placeholder "ee" sound-group clip
- `src/content/audioAssets.ts` - `getAudioUrl`/`getKnownGroupIds`, `NikudGroupId` -> URL manifest via `import.meta.glob`
- `src/hooks/useAudioPlayer.ts` - singleton `AudioContext`, preload/decode, `play(groupId)`
- `vite.config.ts` - added `wav` to Workbox `globPatterns`
- `src/pages/StagePlayer.tsx` - wired `useAudioPlayer().play(...)` into the play button; removed the alert stub
- `src/engine/stageRunner.ts` - removed a pre-existing unused local (blocking-fix, see Deviations)

## Decisions Made
- Keyed audio purely by `NikudGroupId` (not `letterId`) for this phase, matching `Trial.correctGroupId`'s current shape — documented in `audioAssets.ts`'s module header so Phase 3's planner understands why the signature will need to change once letter selection exists.
- Used `.wav` (not `.mp3`) for placeholder clips since macOS `say` outputs WAV natively with no encoder dependency; the `import.meta.glob` pattern already covers both extensions so a later placeholder->real-recording swap needs no code change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused `allGroups` local in `stageRunner.ts`**
- **Found during:** Task 2 (running `npm run build` to verify `audioAssets.ts`/`useAudioPlayer.ts`)
- **Issue:** `npm run build` failed under TypeScript strict mode (`noUnusedLocals`) on a pre-existing dead-code line in `generateTrial()` unrelated to this plan's own files, but blocking the plan's own required `npm run build` verification gate
- **Fix:** Deleted the unused `const allGroups = [...]` line; no behavior change (the variable was never referenced)
- **Files modified:** `src/engine/stageRunner.ts`
- **Verification:** `npm run build` exits 0
- **Committed in:** `4afa691` (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed two pre-existing strict/lint failures in `StagePlayer.tsx`**
- **Found during:** Task 3 (running `npm run build`/`npm run lint` to verify the wiring)
- **Issue:** `npm run build` failed on two pre-existing unused locals (`setStage`, `correctGroup`); `npm run lint` (run with `--max-warnings 0`) failed on a pre-existing `@typescript-eslint/no-explicit-any` cast in `handleOptionSelect` and a pre-existing `react-hooks/exhaustive-deps` warning on the mount effect — all pre-dating this task but in the exact file this task modifies, blocking the plan's mandated build/lint gates
- **Fix:** Removed the two unused locals (no behavior change — neither was read anywhere); typed `handleOptionSelect`'s `groupId` parameter as `NikudGroupId` (imported from `nikudGroups.ts`) instead of casting `groupId as any`; added a scoped `eslint-disable-line react-hooks/exhaustive-deps` with a comment explaining the effect intentionally runs once per `stage.id` change only (adding `usedSyllables`/`stage` to the deps array would cause the effect to re-fire on every answer, regenerating the current trial mid-interaction — a behavior change the plan explicitly forbids: "Change nothing else in the component")
- **Files modified:** `src/pages/StagePlayer.tsx`
- **Verification:** `npm run build` exits 0; `npx eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` reports "No issues found"
- **Committed in:** `eb3904a` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - Blocking, pre-existing strict-mode/lint failures that blocked this plan's own mandated `npm run build`/`npm run lint` verification gates)
**Impact on plan:** Both fixes are non-behavior-changing (dead code removal, type-narrowing instead of `any`, a documented deps-array suppression) confined to files already in this plan's `files_modified` scope or directly gating the plan's verification. No scope creep — no new features, no architectural changes.

## Issues Encountered
- Task 2's own verify step (`ls dist/assets/*.wav` expecting 2 hashed files) is inherently coupled to Task 3's wiring: until `StagePlayer.tsx` imports `useAudioPlayer` (which imports `audioAssets.ts`), Vite's module graph never reaches the `import.meta.glob` call, so the wav files aren't bundled. This is a plan-authoring sequencing artifact, not a code bug — resolved naturally once Task 3 completed; the full check suite (including the dist asset count) was re-verified and passes after Task 3's commit.
- A session/connection drop occurred after Task 3's commit, before SUMMARY.md was written. Re-verified `npm run build` and `npm run lint` both still pass cleanly on resume before writing this summary.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for plan `01-02`: the code path (placeholder-asset -> glob manifest -> decode -> Web Audio playback) is complete and desktop-build-verified; `01-02` owns the blocking real-device acceptance gate (AUDIO-03: iPad Safari + Android tablet tap-to-hear verification) that this plan's Nyquist note explicitly deferred.
- No blockers. `src/engine/` remains pure/React-free (confirmed via grep — no engine file references `useAudioPlayer` or `AudioContext`).

---
*Phase: 01-real-audio-playback-layer*
*Completed: 2026-07-25*

## Self-Check: PASSED

All created files found on disk (src/vite-env.d.ts, src/content/audio/placeholder/{a,i}.wav, src/content/audioAssets.ts, src/hooks/useAudioPlayer.ts). All three task commits (916630d, 4afa691, eb3904a) found in git log.
