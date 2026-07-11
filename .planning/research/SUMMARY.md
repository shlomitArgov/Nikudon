# Project Research Summary

**Project:** Nikudon — Hebrew niqqud phonics PWA
**Domain:** Audio-based, icon-only early-childhood educational game (ages 3-6)
**Researched:** 2026-07-11
**Confidence:** MEDIUM-HIGH

## Executive Summary

Nikudon is an audio-first, icon-only phonics toy that teaches pre-literate 3-6 year-olds to associate niqqud (Hebrew vowel-diacritic) sounds with symbols, via a tap-to-hear/tap-to-answer loop, running as an offline-capable RTL PWA on tablets. Experts building this kind of product (Endless Alphabet, Teach Your Monster to Read, Duolingo ABC) converge on the same core recipe: instant multisensory feedback, unlimited self-paced retry with no punishment/timers/scores, oversized touch targets, and navigation that never depends on reading. Nikudon's existing architecture (content/engine/pages layers, React Router with URL-as-state, in-memory mastery tracking) is already well-aligned with this pattern and needs targeted extension rather than a rewrite: a real audio-playback layer (replacing the current `alert()` stub), a letter-picker screen, and a fix to trial generation so distractors are drawn only from different sound-groups.

The recommended technical approach is to skip audio libraries entirely and hand-roll a thin Web Audio API wrapper (`AudioContext` + pre-decoded `AudioBuffer`s + fresh `AudioBufferSourceNode` per tap), because the use case — dozens of short, single-voice, pre-recorded syllable clips triggered on tap — is narrow enough that a ~50-line custom hook beats both `HTMLAudioElement` (which has a documented Safari repeat-play delay bug and unpredictable first-play latency) and third-party libraries like Howler.js (stale maintenance, unneeded feature surface). This same choice — Web Audio API over `<audio>` — is independently reinforced by both STACK.md and PITFALLS.md as the single highest-leverage technical decision in this milestone.

The dominant risk cluster is device-specific and easy to miss in normal development: iOS Safari blocks audio unless `AudioContext.resume()`/first playback happens synchronously inside a user-gesture handler (no exceptions for installed PWAs, unlike Android), niqqud diacritics can silently fail to render or mis-stack depending on font/browser without any visible error, and bidi (RTL/LTR mixing) bugs can corrupt any screen that ever mixes Hebrew with numerals or Latin text. None of these produce console errors or fail on desktop Chrome — they require real-device testing (iPad Safari + Android tablet) as a standing acceptance gate for any phase touching audio, fonts, or mixed-content strings. A second, distinct risk is pedagogical rather than technical: the currently-known bug where trial distractors are drawn from all niqqud groups (rather than only cross-sound-group) actively teaches a false lesson to a child who cannot yet reason about grammar-dependent pronunciation — this must be fixed as a hard acceptance criterion for the level-1 curriculum, not treated as a nice-to-have polish item.

## Key Findings

### Recommended Stack

No new runtime dependencies are needed. The entire audio layer is native Web Audio API (`AudioContext`, `decodeAudioData`, `AudioBufferSourceNode`), wrapped in a small project-specific hook — no Howler.js, no `use-sound`, no audio sprites (unnecessary at this catalog size). The existing `vite-plugin-pwa` (`^0.17.4`) config already globs `mp3`/`ogg` for Workbox precaching, so no PWA-plugin changes are required. Offline-editing tooling (ffmpeg, for trimming/normalizing recorded clips before they enter the repo) is a content-authoring step, not a build dependency.

**Core technologies:**
- Web Audio API (`AudioContext` + `AudioBuffer` + `AudioBufferSourceNode`) — low-latency, no-repeat-delay playback for short tapped clips — avoids a documented Safari `<audio>` re-trigger bug and unpredictable first-play latency
- Hand-rolled `useAudioPlayer` hook (~50 lines, no library) — narrow single-voice, no-crossfade use case doesn't justify a third-party dependency
- Existing `vite-plugin-pwa` / Workbox precache (already configured, `mp3`/`ogg` already globbed) — no changes needed, just ensure new audio files land somewhere the glob covers

### Expected Features

Nikudon's level-1 vertical slice must nail the "table stakes" of kids' educational-app UX before any delight/differentiation work; these are all low-complexity but non-negotiable for the target age group.

**Must have (table stakes):**
- Non-punishing wrong-answer feedback — neutral/soft sound and animation, never a buzzer or red flash-and-shake
- Unlimited retry, no scoring, no "game over" state
- Instant multisensory feedback (sound + visual) on every tap, including a persistent replay-audio affordance
- Icon-only, text-free UI (play, replay, back, checkmark/X — no written labels)
- Large touch targets (~64-80px minimum, well above adult 44-48px norms) with generous spacing
- Short, low-choice screens (2-3 answer options, not a full grid) and self-paced, untimed trials
- Persistent, always-visible way back to the letter-picker
- Session length that naturally fits within a young child's ~5-10 min attention window

**Should have (competitive, v1.x+):**
- Voice-guided narration layer (greeting/encouragement in Hebrew) — natural fit given real recorded audio is already the plan
- Haptic feedback on tap
- Additional letters wired into the picker beyond the first proven one

**Defer (v2+):**
- Character/mascot animation reacting to taps (Endless Alphabet-style) — delight layer, prove the core loop first
- Progress persistence, reward/collection systems, adaptive pacing — all blocked on persistence, explicitly out of scope this milestone
- `matchTheMark` second game mode, full curriculum beyond level 1

**Anti-features (must not build):** countdown timers, competitive scoring/leaderboards, text instructions/tooltips, deep multi-level menus, auto-advancing screens without a child tap, TTS synthetic voice for core sound clips, Kamatz Katan as an answer option.

### Architecture Approach

Extend the existing content/engine/pages layering additively rather than restructuring it. A new `LetterPicker.tsx` page (mirroring `Home.tsx`'s navigation pattern) selects a letter and passes it via route param (`/stage/:stageId/:letterId`) into a modified `StagePlayer.tsx`, which now drives real audio through a new `hooks/useAudioPlayer.ts`. `engine/stageRunner.ts`'s `generateTrial()` gains a required `letterId` parameter and is fixed to scope distractors to `[stage.introducedGroupId, ...stage.reviewGroupIds]` instead of all groups. Two new pure, side-effect-free content-layer files (`content/syllables.ts`, `content/audioAssets.ts`) keep the "content layer has no functions except lookups, engine layer has no DOM/side effects" invariant intact — the only place `Audio`/`AudioContext` is ever touched is the new `hooks/` directory, called from `StagePlayer.tsx`.

**Major components:**
1. `content/audioAssets.ts` (new) — single source of truth mapping `(letterId, groupId) → playable URL`, built from a filename convention so content authors can add clips without code changes
2. `hooks/useAudioPlayer.ts` (new) — the sole place `AudioContext`/audio playback is instantiated; thin React glue over the Web Audio API wrapper
3. `pages/LetterPicker.tsx` (new) — icon-only, large-touch-target letter selection screen, navigates via URL param
4. `engine/stageRunner.ts` (modified) — `generateTrial()` becomes letter-aware and sound-group-scoped (bug fix)
5. `content/letters.ts` / `content/syllables.ts` (modified/new) — stable ASCII letter ids and glyph-composition helpers, avoiding Hebrew glyphs as filenames/keys (bidi/encoding risk)

### Critical Pitfalls

1. **iOS Safari blocks audio outside a synchronous user-gesture handler** — no `await`/deferred call before the first `.play()`/`resume()`; unlock a single shared `AudioContext` on the very first app tap; verify on a real iPad, not just desktop Chrome
2. **`<audio>` element latency breaks the tap-to-sound phonics loop** — always use pre-decoded `AudioBuffer`s via Web Audio API for gameplay sounds, never `new Audio()`/`<audio>` for trial playback
3. **Sound-identical niqqud presented as a discriminable choice** — distractors must be drawn only from *other* sound-groups; add an automated invariant test (`correctAnswer.soundGroup !== distractor.soundGroup`) since this is a pedagogical-correctness bug, not a difficulty setting
4. **Icon-only navigation that still secretly relies on reading** (tooltips/aria-labels as sole disambiguator, adult-convention icons) — pair every icon with redundant color/motion/sound cues, restrict to genuinely universal signage
5. **Niqqud diacritics silently vanish or misrender** depending on font/browser combination, with no console error — explicitly choose and verify a font with complete niqqud OpenType mark/mkmk support, tested on real target devices, not just a code editor

## Implications for Roadmap

Based on combined research, suggested phase structure for this milestone:

### Phase 1: Real Audio Playback Layer
**Rationale:** Every other icon-only interaction (replay button, "hear and tap" loop) is meaningless without real audio behind it — this is the most-cited dependency root across FEATURES.md and ARCHITECTURE.md, and its two failure modes (iOS gesture-binding, `<audio>` latency) are the highest-severity pitfalls identified.
**Delivers:** `hooks/useAudioPlayer.ts`, `content/audioAssets.ts`, replacement of the `alert()` stub in `StagePlayer.tsx` with real Web Audio API playback, AudioContext unlock-on-first-tap wiring.
**Addresses:** "Real recorded audio playback" and "Replay-audio affordance" table-stakes features.
**Avoids:** Pitfall 1 (iOS gesture/autoplay failure), Pitfall 2 (`<audio>` latency).
**Open question to resolve before/at start of this phase:** audio asset file location — see Research Flags below.

### Phase 2: Trial Generation Correctness Fix
**Rationale:** This is a pure logic fix (no new UI), independently deliverable, and is a documented pedagogical-correctness bug already flagged in the project's own CONCERNS.md — should land early since it's cheap now (no persisted data to migrate) and increasingly risky to leave in place once more content is added.
**Delivers:** `generateTrial()` scoped to `[stage.introducedGroupId, ...stage.reviewGroupIds]`, plus a `letterId` parameter threaded through; automated test asserting distractor/correct-answer sound-group disjointness.
**Addresses:** "Trial generation restricted to level/letter-relevant niqqud sound-groups" table-stakes feature.
**Avoids:** Pitfall 3 (sound-identical niqqud presented as discriminable), Pitfall 8 (engagement mistaken for learning — includes fixing the known premature-mastery boundary bug).

### Phase 3: Letter-Picker Screen
**Rationale:** Depends on Phase 1 (audio) conceptually for validation and Phase 2 (letter-aware `generateTrial`) for its data contract — sequence after both so the picker can filter by `getAvailableLetterIds()` and hand off a working `letterId` into a correctly-scoped trial.
**Delivers:** `pages/LetterPicker.tsx` + CSS, `content/letters.ts` with stable ASCII ids, route change to `/stage/:stageId/:letterId`, `Home.tsx` updated to navigate to `/letters` first.
**Addresses:** "Letter-picker screen" table-stakes feature, large-touch-target requirement.
**Uses:** ARCHITECTURE.md Pattern 3 (keep Stage and letter selection orthogonal), Pattern 1 (`import.meta.glob` convention-over-configuration manifest, pending the file-location decision below).
**Avoids:** Pitfall 5 (touch targets too small for small hands) — new interactive grid introduced here.

### Phase 4: Icon-Only Nav, Feedback Tone, and Touch-Target Pass
**Rationale:** A cross-cutting UX/visual phase that should come after the functional plumbing (audio, correct trials, picker) exists, so real interactive elements can be redesigned/tested rather than mocked.
**Delivers:** Non-punishing feedback tone (sound/animation/color revisit for correct/incorrect), consistent icon vocabulary (play/replay/back/check/X) with redundant color+motion+sound cues, project-wide ~64-80px touch-target minimum with spacing enforcement.
**Addresses:** "Non-punishing feedback tone pass," "Icon-only nav," "Large touch targets" table-stakes features.
**Avoids:** Pitfall 4 (icon-only navigation that isn't actually intuitable), Pitfall 5 (touch targets), general UX pitfalls (negative feedback framed as punishment).

### Phase Ordering Rationale

- Audio must land first because it is a hard dependency for the replay icon and the entire "hear and tap" interaction model (FEATURES.md dependency graph).
- The trial-generation fix is sequenced early and independently because it's low-cost, high-pedagogical-risk, and blocks nothing else architecturally — but the letter-picker phase needs the `letterId`-aware signature it introduces.
- The letter-picker is sequenced after both audio and trial-generation so it can be validated against real (not stubbed) audio and correctly-scoped trials.
- The cross-cutting UX/feedback-tone/touch-target pass comes last because it's most valuable applied against real, functioning screens rather than as a separate isolated redesign.
- Niqqud font selection and bidi verification (Pitfalls 6 & 7) are not a standalone phase — they should be treated as an early, one-time locking decision (before curriculum content is finalized) and then an ongoing verification checklist item across every phase touching new UI copy or niqqud content.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Audio Playback Layer):** Needs a decision, not just research, before planning starts — **STACK.md and ARCHITECTURE.md disagree on audio asset file placement.** STACK.md recommends `public/audio/` (files referenced by plain string path; Workbox's own content-hash precache manifest already drives cache invalidation, so Vite's import-hashing is redundant for this use case). ARCHITECTURE.md recommends `src/content/audio/` with `import.meta.glob({ eager: true })` (gives Vite content-hashed cache-busting on top of Workbox's, and yields an automatic, zero-code-change manifest for content authors dropping in new files, satisfying the "content authors can add letters without code changes" goal). This is an open question that materially affects the shape of `audioAssets.ts` and should be explicitly resolved (not silently decided by whichever agent plans the phase) before Phase 1 planning begins — recommend the roadmapper/planner surface this as an explicit decision point in that phase's plan, weighing "simpler string-path content authoring" (public/) against "automatic manifest + double cache-busting layer" (src/content/).
- **Phase 1 (Audio Playback Layer):** Also needs `--research-phase` depth specifically for iOS Safari gesture-unlock verification steps and real-device test protocol — this is a class of bug invisible in normal desktop development.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Trial Generation Fix):** Pure logic change with a clear, already-documented fix path (filter by sound-group) and existing test infrastructure — no new research needed.
- **Phase 3 (Letter-Picker Screen):** Follows the exact same page/route/navigation pattern already established by `Home.tsx`/`App.tsx` — standard, well-understood extension.
- **Phase 4 (Icon/Feedback/Touch-Target Pass):** Guidance is well-documented and consistent across FEATURES.md/PITFALLS.md sources (touch-target sizing, icon redundancy) — implementation is CSS/asset work, not novel technical research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Native browser APIs cross-verified across MDN, Chrome DevRel, WebKit bug tracker, and npm/GitHub registry data; no single-source claims |
| Features | MEDIUM | Web-sourced UX practitioner writeups and public app reviews/case studies (Endless Alphabet, Teach Your Monster to Read, Duolingo ABC); no single authoritative spec exists for this niche, but findings converge across independent sources |
| Architecture | MEDIUM (HIGH on codebase-specific parts) | Direct codebase inspection is HIGH confidence; audio-tooling specifics (asset placement/glob behavior) cross-checked against current Vite/vite-plugin-pwa docs at MEDIUM confidence, and this is the exact area of the STACK/ARCHITECTURE conflict noted above |
| Pitfalls | MEDIUM | Web-search-derived, cross-checked across multiple independent sources including primary bug-tracker reports (WebKit, Bugzilla, Launchpad) for the highest-severity items; no official Context7-indexed library covers this milestone's core risk surface |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Audio asset file placement (`public/audio/` vs `src/content/audio/` + `import.meta.glob`):** Direct conflict between STACK.md and ARCHITECTURE.md, described above under Research Flags — must be explicitly decided (not silently defaulted) when Phase 1 is planned. Recommend documenting the decision and rationale in that phase's plan.
- **Whether both patach AND kamatz are ever shown as correct-answer targets** within the "ah" sound-group, or only one canonical grapheme per sound for early levels — flagged in PITFALLS.md as needing an explicit content-design decision, not yet resolved by any research file.
- **Real-device (iPad Safari, Android tablet) verification protocol** — all research strongly recommends this as a standing acceptance gate for audio/font/touch-target phases, but no concrete test-device/process has been established yet; should be defined during Phase 1 planning.
- **Icon comprehension validation with actual children in the target age range** — recommended by FEATURES.md/PITFALLS.md but not currently planned as part of any phase's acceptance criteria; consider whether this is in-scope for this milestone or explicitly deferred.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/content/{letters,nikudGroups,stages}.ts`, `src/engine/stageRunner.ts`, `src/pages/{Home,StagePlayer}.tsx`, `src/App.tsx`, `vite.config.ts`, `package.json`
- `.planning/codebase/CONCERNS.md` and `.planning/PROJECT.md` — first-party project documents
- MDN Web Docs (`BaseAudioContext.decodeAudioData()`, `AudioBuffer`, autoplay guide)
- WebKit Bug Tracker, Mozilla Bugzilla, Launchpad — primary bug reports on Safari repeat-play delay and niqqud font-fallback failures

### Secondary (MEDIUM confidence)
- Chrome for Developers ("Web Audio FAQ," autoplay policy, HTML5 audio vs Web Audio API latency)
- Vite official docs ("Static Asset Handling") and vite-plugin-pwa docs/GitHub issues
- Endless Alphabet / Teach Your Monster to Read / Duolingo ABC public reviews and case studies (Common Sense Media, TV Tropes, Duolingo Blog)
- NN/G articles on children's UX and physical-development-based touch-target sizing
- W3C WAI (WCAG 2.5.8 Target Size Minimum)

### Tertiary (LOW confidence)
- Independent implementation write-ups (Matt Montag on AudioContext unlock, Robert O'Callahan on `<audio>` latency) — corroborated by primary sources but originally single-author blog posts

---
*Research completed: 2026-07-11*
*Ready for roadmap: yes — with one open decision flagged above (audio asset placement) that should be resolved during Phase 1 planning*
