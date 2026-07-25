# Phase 1: Real Audio Playback Layer - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the `alert('Audio will play here')` stub at `src/pages/StagePlayer.tsx:96` with real, tap-reliable audio playback of recorded native-speaker syllable clips, using the native Web Audio API (no library dependency, per research). Includes the audio asset layer (file placement, lookup-by-key), the playback hook, iOS/Android gesture-unlock handling, and a real-device test pass. Does not include curriculum/content correctness fixes (Phase 2) or the letter-picker screen (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Recording pipeline & dev placeholders
- **D-01:** Real recorded native-speaker clips are a production/content task outside this phase's build scope. For Phase 1 development and testing, use short placeholder clips (e.g. simple recorded or synthesized tones/beeps, or a temporary TTS stand-in) clearly named/located so they're trivially swappable later (e.g. a `placeholder` naming convention or subfolder).
- **D-02:** Only enough clips to validate the playback layer are needed in Phase 1 — one letter's worth (2 clips: "ah" + "ee" sound for a single representative letter) is sufficient to prove the mechanism end-to-end. Full recording inventory across all 22 letters is a later content-production concern, not a Phase 1 blocker.

### Missing/failed audio handling
- **D-03:** If a clip is missing or fails to load, fail soft: no harsh error dialog, no broken-looking UI. Log a console warning (dev-visible) and treat it gracefully in the UI (e.g. play button stays tappable, no crash). Exact fallback visual (retry icon vs. silent no-op) left to planner/executor discretion — not user-validated, revisit if it feels wrong in practice.

### Voice/persona
- **D-04:** No specific persona locked yet — defer to whoever produces the real recordings later. For Phase 1 placeholder purposes, any clear, neutral placeholder sound is fine.

### File placement (already flagged, reaffirmed here)
- **D-05:** The `public/audio/` vs. `src/content/audio/` + `import.meta.glob` conflict (STACK.md vs. ARCHITECTURE.md) is left to the phase researcher/planner to resolve explicitly and document — not a user decision.

### Claude's Discretion
This entire phase was scoped in "vibe mode" — the user asked to skip detailed discussion and let Claude make reasonable implementation calls, to be corrected later if wrong. Treat D-01 through D-04 above as low-confidence defaults, not firm requirements. The planner and executor should flag anything in this CONTEXT.md that turns out to conflict with better information during planning/research rather than treating it as locked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/STACK.md` — recommends native Web Audio API, no library; recommends `public/audio/` placement
- `.planning/research/ARCHITECTURE.md` — recommends `src/content/audio/` + `import.meta.glob`; unresolved conflict with STACK.md, must be decided during this phase's planning
- `.planning/research/PITFALLS.md` — iOS Safari gesture-unlock requirement, Safari `<audio>` repeat-play bug, real-device testing gate
- `.planning/research/SUMMARY.md` — synthesized findings, explicitly flags the placement conflict

### Project
- `.planning/PROJECT.md` — Core Value, Constraints (recorded audio required, no TTS for production), bidi/RTL handling note
- `.planning/REQUIREMENTS.md` — AUDIO-01 through AUDIO-04
- `.planning/ROADMAP.md` Phase 1 section — goal, success criteria, notes on the placement conflict and real-device gate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts` — `vite-plugin-pwa` already configured with `workbox.globPatterns` including `mp3,ogg`; no plugin config change needed for precaching once audio files exist somewhere the glob covers.

### Established Patterns
- `src/engine/` is pure, React-free, testable logic (per CONVENTIONS.md/ARCHITECTURE.md) — any audio playback code must NOT leak into `engine/`; keep it isolated to a new hook (e.g. `src/hooks/useAudioPlayer.ts`) per research/ARCHITECTURE.md's recommendation.
- `src/content/` currently holds only static data modules (`letters.ts`, `nikudGroups.ts`, `stages.ts`) — no existing audio-asset lookup module yet.

### Integration Points
- `src/pages/StagePlayer.tsx:96` — the exact line with the `alert()` stub to replace.
- `Trial.audioSyllable` (from `src/engine/stageRunner.ts`) — the existing field intended to key into audio lookup, currently just a hardcoded string from `nikudGroups.exampleSyllables`.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — user explicitly deferred implementation details to Claude's judgment for this phase ("vibe mode"). Revisit and correct decisions D-01 through D-04 as needed once real progress surfaces issues.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (discussion itself was skipped by user request).

</deferred>

---

*Phase: 1-Real Audio Playback Layer*
*Context gathered: 2026-07-25*
