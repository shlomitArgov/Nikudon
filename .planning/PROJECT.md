# Nikudon

## What This Is

Nikudon — Hebrew name: ניקודון — is a tablet-based, icon-only Hebrew niqqud (vowel-sign) learning game for pre-literate children ages 3-6. Kids already recognize the Hebrew alphabet and can identify the opening sounds of words, but can't yet read or sound out niqqud. In the game, a child picks a letter, hears a recorded syllable, and taps the matching niqqud symbol — no reading required, only universal icons (play, checkmark, X, back/return).

## Core Value

A child who can't read should be able to play unassisted, guided purely by sound and universal icons, and correctly learn to associate niqqud symbols with their modern Hebrew sounds.

## Requirements

### Validated

- ✓ Routing skeleton (Home → StagePlayer by stage id) — existing
- ✓ Niqqud sound-group data model (patach/kamatz="ah", segol/tzere="eh", hiriq="ee", holam="oh", kubutz/shuruk="oo") — existing, confirmed linguistically correct for modern Israeli Hebrew via web research
- ✓ Pure trial-generation & mastery-tracking engine (`src/engine/stageRunner.ts`) — existing
- ✓ `hearAndTap` game mode UI with tap-to-answer + correct/incorrect feedback animations — existing
- ✓ RTL/tablet design tokens and base styles — existing

### Active

- [ ] Real recorded audio playback replaces the `alert()` stub in `StagePlayer.tsx`
- [ ] Letter-picker screen: child selects from all 22 consonants they already know
- [ ] Level 1 curriculum: for a chosen letter, drill the "ah" sound (patach/kamatz) and "ee" sound (hiriq)
- [ ] Icon-only navigation: back-to-letter-picker, replay-sound, play, checkmark/X feedback — no reliance on reading text or instructions
- [ ] Kamatz Katan excluded entirely from content/curriculum
- [ ] Calm, simple, "cute" visual/color redesign of Home and StagePlayer

### Out of Scope

- `matchTheMark` second game mode — type already exists but unbuilt; deferred to focus near-term effort on the core `hearAndTap` loop
- Progress persistence across app restarts — in-memory state is sufficient to validate level 1; persistence comes later
- Full curriculum beyond level 1 (o/u sounds, multi-letter progression across all 22 letters) — prove the level-1 vertical slice first
- Kamatz Katan as a taught niqqud — permanently excluded, not just deferred (same glyph as Kamatz Gadol but pronounced differently depending on grammatical context, which pre-readers can't judge)
- Reading/spelling instruction — this is explicitly a pre-reading phonics primer, not a reading app

## Context

- The existing codebase already has a working vertical slice of the `hearAndTap` gameplay loop (Home → StagePlayer → generate trial → tap → feedback), but audio, stage progression, and navigation are stubbed or incomplete. See `.planning/codebase/CONCERNS.md` for the full list.
- Audience: children ages 3-6 who know the Hebrew alphabet and can identify opening sounds of words but cannot yet read or sound out niqqud.
- Design must be entirely icon/audio driven — no reliance on reading UI text or instructions, only common signage (play, forward/back, green check, red X).
- Modern Israeli Hebrew niqqud pronunciation has fewer distinct sounds than written signs: patach/kamatz, segol/tzere, and kubutz/shuruk are pronunciation-identical pairs (confirmed via web research against Wikipedia's Niqqud and Hebrew diacritics articles). The app must group niqqud by sound, not by grapheme, when generating trial answer options — this matches the existing `nikudGroups.ts` design.
- `src/content/letters.ts` (the 22 consonants) exists but is currently unused by the engine or UI — level 1 requires wiring it into letter selection and syllable/content generation.
- `generateTrial()` currently draws distractor options from *all* niqqud groups rather than restricting to groups relevant to the chosen letter/level — needs correcting as part of level 1 work.

## Constraints

- **Audience**: Ages 3-6, pre-literate — all UI must be intuitable via universal icons and sound alone, no reading required
- **Platform**: Tablet-first, installable PWA, RTL Hebrew layout (already established in `index.html`/`vite.config.ts`)
- **Audio**: Must use real recorded native-speaker audio clips (not TTS) for pronunciation accuracy
- **Content correctness**: Niqqud sound-equivalence must be respected — never present two same-sound niqqud as competing distractor options in the same trial; Kamatz Katan excluded entirely from content
- **Bidi text handling**: Mixing Hebrew (RTL) and English (LTR) text — in docs, code comments, or UI — is prone to bidi-algorithm rendering bugs (e.g. reordering around punctuation/parentheses). Avoid inline Hebrew-in-parentheses within English sentences; prefer Hebrew on its own line/element, or wrap with explicit Unicode directional isolates (U+2067 RLI … U+2069 PDI) when inline mixing is unavoidable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Group niqqud by modern pronunciation, not grapheme, as the selectable game unit | Two visually different niqqud can sound identical in modern Hebrew (e.g. patach/kamatz); presenting both as distinct answer options would be unanswerable from audio alone | ✓ Good — confirmed via web research, matches existing `nikudGroups.ts` design |
| Exclude Kamatz Katan from the app entirely | Same glyph as Kamatz Gadol, but sounds "oh" not "ah" — the distinction is purely grammatical/contextual, which pre-readers can't judge | ✓ Good |
| Use recorded native-speaker audio, not TTS | Pronunciation accuracy matters more than build simplicity for a phonics-teaching app | — Pending |
| Defer `matchTheMark` second game mode and progress persistence | Prove the level-1 vertical slice of `hearAndTap` first before expanding scope | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-11 after initialization*
