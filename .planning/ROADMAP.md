# Roadmap: Nikudon

## Overview

Nikudon's level-1 vertical slice ships in four phases that turn the existing scaffolded `hearAndTap` loop into a real, correct, and child-usable phonics toy. Phase 1 replaces the `alert()` stub with real, tap-reliable recorded audio — the hard dependency for every other interaction. Phase 2 is a parallel-safe but pedagogically urgent fix: it corrects trial-generation so distractors are never drawn from the wrong sound-groups, fixes the mastery boundary bug, and narrows content to the level-1 curriculum (one letter, "ah" and "ee" sounds only). Phase 3 builds on both — it adds the letter-picker screen that gives a child an entry point to choose which of the 22 known consonants to drill, wired against real audio and a correctly-scoped trial engine. Phase 4 is a cross-cutting polish pass — icon-only navigation, warm/celebratory feedback tone, large touch targets, and a calm "cute" visual redesign — applied last so it lands against fully working screens rather than mocks.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Real Audio Playback Layer** - Replace the `alert()` stub with real, tap-reliable recorded audio
- [ ] **Phase 2: Level-1 Curriculum & Trial-Generation Correctness** - Fix distractor scoping and mastery logic; narrow content to one letter's ah/ee sounds
- [ ] **Phase 3: Letter-Picker Screen** - Let a child choose which of the 22 known consonants to drill
- [ ] **Phase 4: Icon Navigation, Feedback Tone & Visual Polish** - Make the whole flow icon-only, warm, celebratory, and calm/cute

## Phase Details

### Phase 1: Real Audio Playback Layer

**Goal**: A child can tap to hear a real recorded native-speaker syllable clip for the current letter+sound, reliably, on a real tablet — replacing the current `alert()` stub.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04
**Success Criteria** (what must be TRUE):

  1. Tapping the play button plays a real recorded native-speaker syllable clip for the current letter+sound — the `alert()` stub in `StagePlayer.tsx` is gone
  2. Tapping the play button repeatedly in quick succession replays the clip each time with no audible lag or missed taps
  3. Audio plays reliably on a real iPad (Safari) and a real Android tablet, including inside the installed/standalone PWA, starting from the very first tap of a session
  4. Sound-equivalent graphemes (e.g. patach and kamatz) share a single recorded clip per letter — no duplicate or missing clips per grapheme

**Plans**: 2 plans
**Wave 1**

  - [ ] 01-01-PLAN.md — Tap-to-hear vertical slice (Walking Skeleton): Vite client types, placeholder clips, wav precache glob, audioAssets manifest, useAudioPlayer hook, wired into StagePlayer (removes alert stub)

**Wave 2** *(blocked on Wave 1 completion)*

  - [ ] 01-02-PLAN.md — Real-device acceptance gate: production build + precache check, then blocking human-verify on real iPad Safari + Android tablet, in-tab and installed PWA

**Notes**: Audio asset file placement (`public/audio/` with plain string paths vs. `src/content/audio/` + `import.meta.glob({ eager: true })`) is an unresolved conflict between `research/STACK.md` and `research/ARCHITECTURE.md` — this must be explicitly decided and documented as part of this phase's plan, not silently defaulted by whichever agent plans it. Also: iOS Safari requires the shared `AudioContext` to be unlocked synchronously inside a user-gesture handler (no `await` before first `resume()`/play); this phase's acceptance gate must include verification on a real iPad and Android tablet, not just desktop Chrome (see `research/PITFALLS.md`).

### Phase 2: Level-1 Curriculum & Trial-Generation Correctness

**Goal**: For any chosen letter, the game drills exactly the "ah" and "ee" sounds with pedagogically correct trials that never mislead a child who can't yet reason about grammar-dependent pronunciation.
**Mode:** mvp
**Depends on**: Nothing (independently deliverable — pure logic/content change; sequenced after Phase 1 per project ordering, not blocked by it)
**Requirements**: CONT-02, CONT-03, CONT-04, ENG-01, ENG-02, ENG-03
**Success Criteria** (what must be TRUE):

  1. For a given letter, generated trials only ever drill the "ah" sound (patach/kamatz) and the "ee" sound (hiriq) — no other sound groups appear, and Kamatz Katan never appears in any trial or content list
  2. When a trial's correct sound has multiple graphemes (e.g. patach vs. kamatz), the displayed symbol varies randomly across trials rather than always showing the same one
  3. Trial distractor options are always drawn only from sound-groups relevant to the current stage/letter — never from untaught groups
  4. No trial ever presents two niqqud that sound identical in modern Hebrew (e.g. patach and kamatz) as separate answer options in the same trial
  5. A child is marked as having mastered a stage only after meeting both the minimum trial count and the accuracy threshold — never before the minimum trial count is reached, regardless of streak (fixes the existing boundary bug in `checkMastery()`)

**Plans**: TBD

### Phase 3: Letter-Picker Screen

**Goal**: A child can choose which of the 22 known Hebrew consonants to drill, and can always find their way back to that choice.
**Mode:** mvp
**Depends on**: Phase 1, Phase 2 (needs working audio to validate playback against, and the letter-aware, correctly-scoped `generateTrial()` from Phase 2 as its data contract)
**Requirements**: CONT-01, NAV-02
**Success Criteria** (what must be TRUE):

  1. A child can see all 22 Hebrew consonants on a dedicated picker screen and tap any one of them to start a drill scoped to that specific letter
  2. From the drill screen, a child can tap a back icon at any time to return to the letter-picker screen

**Plans**: TBD
**UI hint**: yes

### Phase 4: Icon Navigation, Feedback Tone & Visual Polish

**Goal**: The entire experience is navigable via universal icons alone, feels warm and non-punishing on mistakes, celebratory on success, has comfortably large touch targets, and reads as calm and "cute" rather than a stubbed-out prototype.
**Mode:** mvp
**Depends on**: Phase 3 (applies redesign/testing against real, functioning screens — picker, drill flow, feedback — rather than mocks)
**Requirements**: NAV-01, NAV-03, NAV-04, NAV-05, VIS-01
**Success Criteria** (what must be TRUE):

  1. A child can complete the entire flow (letter picker → play sound → answer → feedback → back) using only icons (play, forward/back, checkmark, X) with no reliance on reading any text
  2. All interactive touch targets across Home, LetterPicker, and StagePlayer measure at least 64px, verified on a real tablet
  3. Tapping a wrong answer produces warm, non-alarming feedback — no buzzer sound, no red flash, no timer pressure
  4. Tapping the correct answer produces celebratory, encouraging feedback (sound + animation)
  5. Home and StagePlayer use a calm, simple, "cute" color scheme in place of the current default styling

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Real Audio Playback Layer | 0/2 | Not started | - |
| 2. Level-1 Curriculum & Trial-Generation Correctness | 0/TBD | Not started | - |
| 3. Letter-Picker Screen | 0/TBD | Not started | - |
| 4. Icon Navigation, Feedback Tone & Visual Polish | 0/TBD | Not started | - |
