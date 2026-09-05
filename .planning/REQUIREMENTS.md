# Requirements: Nikudon

**Defined:** 2026-07-11
**Core Value:** A child who can't read should be able to play unassisted, guided purely by sound and universal icons, and correctly learn to associate niqqud symbols with their modern Hebrew sounds.

## v1 Requirements

Requirements for the level-1 vertical slice. Each maps to roadmap phases.

### Audio

- [ ] **AUDIO-01**: Child can tap a play button to hear a recorded native-speaker syllable clip for the current letter+sound
- [x] **AUDIO-02**: Child can replay the current sound by tapping again, with no lag on repeated taps
- [ ] **AUDIO-03**: Audio plays reliably on iOS Safari and Android tablets (tap-triggered playback works inside the installed PWA)
- [x] **AUDIO-04**: One recorded clip exists per letter+sound-group, shared across sound-equivalent graphemes (e.g. one "ah" clip serves both patach and kamatz spellings)

### Curriculum

- [ ] **CONT-01**: Child can select any of the 22 Hebrew consonants they already know
- [x] **CONT-02**: For a chosen letter, level 1 drills the "ah" sound (patach/kamatz) and "ee" sound (hiriq)
- [x] **CONT-03**: When a sound has multiple graphemes, the displayed symbol is randomly chosen per trial
- [x] **CONT-04**: Kamatz Katan is excluded from all content

### Gameplay Engine

- [x] **ENG-01**: Trial distractor options are drawn only from sound-groups relevant to the current stage — never never-taught groups
- [x] **ENG-02**: Two niqqud with the same modern pronunciation are never presented as separate options in the same trial
- [x] **ENG-03**: Mastery requires both the minimum trial count and the accuracy threshold (fixes existing boundary bug) — engine fixed; mastery UI itself deferred (removed during the Phase 1 UX iteration)

### Navigation & Feedback

- [ ] **NAV-01**: Child can navigate entirely via icons (play, forward/back, checkmark, X) — no reading required
- [ ] **NAV-02**: Child can return from the drill screen to the letter picker at any time
- [ ] **NAV-03**: All interactive touch targets are at least 64px
- [ ] **NAV-04**: Incorrect-answer feedback is warm and non-alarming — no buzzer, no red flash, no timer
- [ ] **NAV-05**: Correct-answer feedback is celebratory and encouraging

### Visual Design

- [ ] **VIS-01**: Home and StagePlayer use a calm, simple, "cute" color scheme

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Settings

- **SET-01**: Grapheme-selection mode (fixed vs. random) is configurable, e.g. by child age

### Persistence

- **PERS-01**: Child's progress (letters/niqqud mastered) persists across app restarts

### Second Game Mode

- **GAME-01**: `matchTheMark` second mini-game mode — concept not yet defined beyond the existing type placeholder; scope TBD when revisited

### Curriculum Expansion

- **CONT-05**: Full curriculum beyond level 1 — "oh" (holam) and "oo" (kubutz/shuruk) sounds, progression across all 22 letters

## Out of Scope

Explicitly excluded or deferred beyond v2. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Kamatz Katan as a taught niqqud | Permanently excluded — same glyph as Kamatz Gadol but pronounced differently depending on grammatical context, which pre-readers can't judge |
| Reading/spelling instruction | Deferred, not permanently excluded — niqqud sound-mastery is intended as a stepping stone toward a future milestone where children read short words |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIO-01 | Phase 1 | Pending real-device sign-off (01-02) |
| AUDIO-02 | Phase 1 | Complete |
| AUDIO-03 | Phase 1 | Pending real-device sign-off (01-02) |
| AUDIO-04 | Phase 1 | Complete |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 2 | Complete (PR pending review) |
| CONT-03 | Phase 2 | Complete (PR pending review) |
| CONT-04 | Phase 2 | Complete (PR pending review) |
| ENG-01 | Phase 2 | Complete (PR pending review) |
| ENG-02 | Phase 2 | Complete (PR pending review) |
| ENG-03 | Phase 2 | Complete engine; mastery UI deferred |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 3 | Pending |
| NAV-03 | Phase 4 | Pending |
| NAV-04 | Phase 4 | Pending |
| NAV-05 | Phase 4 | Pending |
| VIS-01 | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 17 total
- Mapped to phases: 17 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-07-11*
*Last updated: 2026-07-11 after roadmap creation*
