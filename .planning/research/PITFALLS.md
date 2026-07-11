# Pitfalls Research

**Domain:** Hebrew niqqud phonics learning PWA for pre-literate children (ages 3-6), tablet-first, RTL, audio-driven
**Researched:** 2026-07-11
**Confidence:** MEDIUM (web-search-derived, cross-checked across multiple independent sources; no official Context7-indexed library involved for this milestone's core risk surface)

## Critical Pitfalls

### Pitfall 1: Audio doesn't play on first tap on iPad/iOS Safari (autoplay + gesture-binding failure)

**What goes wrong:**
Developer wires up `audio.play()` (or `AudioContext` playback) from a "play sound" button, tests on desktop Chrome, ships it — and on iPad/iOS Safari the very first tap of a session produces silence, or subsequent auto-advance-triggered sounds silently fail. For an audio-only, icon-only game where a mute child cannot tell "the app is broken" from "I tapped the wrong niqqud," this is catastrophic: no error message can be shown (no reading), and the whole gameplay loop depends on audio being reliable.

**Why it happens:**
iOS Safari requires audio playback to originate from *inside* a user-gesture event handler (click/tap), with no exceptions for installed/home-screen PWAs — unlike Android Chrome, which relaxes this for PWAs added to the home screen based on engagement heuristics. If the syllable sound is triggered via `setTimeout`, a promise chain, React state-effect, or any deferred/async call *after* the tap handler returns, iOS silently blocks it (`play()` rejects). `AudioContext` also starts in a `"suspended"` state on iOS until explicitly `resume()`d inside a gesture handler. A second common trap: pre-fetching/decoding the *next* trial's audio while the current trial's feedback animation is playing can accidentally trigger playback outside a gesture window if the code auto-plays the new syllable when the next trial mounts.

**How to avoid:**
- Trigger playback synchronously inside the tap/click handler — no `await` before the first `.play()`/`resume()` call in the chain.
- Create and `resume()` a single shared `AudioContext` on the very first user tap anywhere in the app (e.g. the letter-picker screen), then reuse it for all subsequent programmatic sound triggers for the rest of the session — this "unlocks" audio for iOS.
- Never auto-play a new trial's syllable on mount without a preceding tap in the same gesture window (e.g. require the child to tap "replay/play" icon to hear each new trial, rather than auto-playing).
- Test on a real iPad in Safari (not just Chrome DevTools device emulation) before considering audio "done."

**Warning signs:**
- Audio works in Chrome desktop dev but a manual iPad Safari test hasn't been done.
- Any `play()` call sits behind a `.then()`, `async` function boundary, or component-mount effect rather than directly in the tap handler.
- No dedicated `AudioContext`/audio-unlock step exists in the code.

**Phase to address:**
Audio playback implementation phase (the phase that replaces the `alert()` stub in `StagePlayer.tsx`) — must include real-device iPad Safari verification as an explicit acceptance check, not just unit tests.

---

### Pitfall 2: Perceptible latency between tap and sound breaks the phonics feedback loop

**What goes wrong:**
Using a plain HTML5 `<audio>` element (`new Audio(url); audio.play()`) for every trial introduces unpredictable latency — the browser must fetch, buffer, and decode before playback starts, which can be 100s of milliseconds or more on a first play, and is inconsistent across repeats. For a 3-6-year-old whose whole task is "hear the sound, tap the matching symbol," this delay breaks the audio-to-symbol association the game is trying to teach, and repeated laggy taps read as "broken" rather than "slow."

**Why it happens:**
`<audio>` elements are designed for streaming media playback, not precise low-latency triggering; they don't pre-decode into memory and don't support precise scheduling. Developers reach for `<audio>` first because it's simpler API surface, not realizing the latency cost until testing on real hardware/network conditions.

**How to avoid:**
- Use the Web Audio API (`AudioContext` + pre-decoded `AudioBuffer`s) for every syllable sound played during gameplay, not `<audio>` elements.
- Pre-load and pre-decode all audio needed for the *current* stage/letter into `AudioBuffer`s before the first trial renders (a short "loading" state is acceptable; a laggy first tap is not).
- Reserve `<audio>` elements only for non-gameplay-critical content if ever needed (e.g. background music, which this app likely doesn't need).

**Warning signs:**
- `new Audio(...)` or `<audio src=...>` used anywhere in the trial-playback path.
- No pre-loading/pre-decoding step before a stage starts; sounds fetched on-demand at tap time.

**Phase to address:**
Audio playback implementation phase.

---

### Pitfall 3: Presenting sound-equivalent niqqud as a discriminable choice (pedagogically unanswerable trial)

**What goes wrong:**
A trial is generated where the correct answer is (say) patach and a distractor option is kamatz — but in modern Hebrew these sound identical. A child who taps kamatz is marked "wrong" for a sound that is, to their ear, indistinguishable from correct. This isn't just a minor bug — it actively teaches a false lesson (that two sounds differ when they don't) and erodes trust in the feedback signal the whole game relies on ("if I got it wrong, I misheard" becomes untrue).

**Why it happens:**
This is explicitly already flagged as a known gap in this project (`generateTrial()` currently draws distractors from *all* niqqud groups). The general pedagogical principle from auditory-discrimination/minimal-pairs teaching literature: you never quiz a discrimination the target audience is not *supposed* to be able to make. Two sound-identical symbols aren't a "hard" minimal pair — they're not a minimal pair at all from an audio-only child's perspective, and testing them against each other is a category error, not a difficulty setting.

**How to avoid:**
- Distractor generation must draw only from *other sound-groups*, never from within the same sound-group as the correct answer (this matches the existing `nikudGroups.ts` sound-grouping design — the fix is wiring `generateTrial()` to respect it).
- Add an explicit invariant check/test: for any generated trial, assert `correctAnswer.soundGroup !== distractor.soundGroup` for every distractor.
- Within a sound-group with two graphemes (patach/kamatz, segol/tzere, kubutz/shuruk), decide and document which single grapheme is taught as "the" answer for early levels (per PROJECT.md, level 1 covers "ah" via patach/kamatz and "ee" via hiriq — clarify whether both patach AND kamatz are ever shown as correct-answer targets, or only one per sound to avoid the child needing to guess which grapheme is "expected" when both are audio-correct).

**Warning signs:**
- Any trial-generation code path that pulls candidate distractors from a flat list of all niqqud symbols rather than filtering by sound-group membership.
- No unit test asserting distractor/correct-answer sound-group disjointness.

**Phase to address:**
Level 1 curriculum phase (trial-generation correction is already an identified Active requirement in PROJECT.md — treat the sound-group-disjointness invariant as a hard acceptance criterion, not a nice-to-have).

---

### Pitfall 4: Icon-only navigation that isn't actually intuitable without reading

**What goes wrong:**
"Icon-only" gets implemented as "an icon with a tooltip/aria-label" or "an icon plus a small text caption," which still functionally requires either hovering (impossible on touch) or reading (impossible for the audience) to disambiguate. Or, icons are chosen that are common in adult software conventions (e.g. a gear for settings, a hamburger menu) but not part of a 3-6-year-old's existing visual vocabulary. Children end up randomly tapping everything until something works, which is not "unassisted play" — it's trial-and-error UI archaeology.

**Why it happens:**
Developers default to conventions from general web/app design (where text labels are always a fallback) and don't validate icon comprehension with the actual target age group before committing to an icon set. Existing codebase already shows this pattern risk: the audio button relies on a bare emoji (🔊) with only an `aria-label` for disambiguation (screen-reader-only, invisible to a sighted-but-non-reading child).

**How to avoid:**
- Restrict icon vocabulary to the small set of genuinely universal signage children already encounter (play triangle, green check, red X, back/return arrow) — per PROJECT.md's own constraint — and avoid inventing new iconography per screen.
- Pair every icon with a **redundant non-text cue**: color (green=correct/go, red=wrong/stop), motion (bounce, wiggle), and sound (a consistent "success chime" / "try again" sound distinct from the phonics content itself) — not just visual shape alone, since color/shape recognition still varies by exact age within 3-6.
- Validate the icon set with actual children in the target age range (even informally) before finalizing the level-1 UI redesign, rather than assuming adult-intuitive icons transfer down.

**Warning signs:**
- Any interactive element whose sole disambiguator is an `aria-label`, tooltip, or text caption.
- Icon choices borrowed from generic UI kits without visual-simplicity review (too much internal detail loses legibility at a glance for young children).
- No corroborating audio/color/motion signal alongside an icon's meaning.

**Phase to address:**
Icon-only navigation + visual redesign phase (Active requirements: "Icon-only navigation" and "Calm, simple, 'cute' visual/color redesign").

---

### Pitfall 5: Touch targets and spacing sized for adult fingers, not small hands with developing fine motor control

**What goes wrong:**
Buttons sized to typical web/adult mobile conventions (e.g. 44px iOS HIG minimum) are too small and packed too closely for a 3-6-year-old's less-precise motor control, causing frequent mis-taps that read as "wrong answer" feedback (red X) when the real failure was motor, not cognitive. This is especially damaging in a phonics app where a mis-tap due to fat-fingering an adjacent option gets recorded as an incorrect trial result, corrupting the mastery-tracking data the whole progression system depends on.

**Why it happens:**
Standard accessibility/HIG touch-target guidance (typically ~44-48px) is calibrated for adult fingers and reasonably steady hands; young children need targets roughly 4x the adult-recommended minimum area, with generous spacing between adjacent tappable elements to prevent accidental double-hits.

**How to avoid:**
- Size primary tappable answer options (niqqud symbols, letter tiles) well above standard mobile minimums — treat "at least ~2cm × 2cm physical size" and "~64px logical gap between adjacent targets" as a floor, not a ceiling, for this audience.
- Debounce/ignore rapid double-taps on the same or adjacent targets within a short window, since accidental double-taps are common with developing fine motor control.
- Design layouts with fewer, larger simultaneous choices per trial rather than dense grids (this also has a pedagogical benefit: fewer distractors per trial reduces cognitive load, separate from the motor-precision concern).

**Warning signs:**
- Answer-option buttons reuse default component-library button sizing without a kids-specific override.
- No minimum-gap enforcement between adjacent interactive elements in the trial UI.
- Mastery-tracking data (once persistence exists) shows suspiciously high wrong-answer rates on options adjacent to the correct one — a signature of motor mis-taps rather than genuine sound confusion.

**Phase to address:**
Visual/UX redesign phase and letter-picker phase (both introduce new large interactive grids of tappable targets).

---

### Pitfall 6: Niqqud diacritics silently vanish or misrender depending on font/browser combination

**What goes wrong:**
The chosen web font doesn't include (or incompletely implements) niqqud glyph positioning. Rather than erroring or falling back visibly, the browser can simply **not render the diacritic at all** — the child sees a bare consonant with no vowel mark, making the "tap the matching niqqud symbol" task literally impossible to complete correctly, with no visible indication anything is wrong. This is a documented, long-standing browser behavior (not a hypothetical edge case).

**Why it happens:**
When niqqud combining marks are missing from the active/specified font, historically Gecko/Firefox (and other engines) do not fall back to substitute the glyph from another font in the stack the way they would for a missing base letter — the mark is simply dropped, silently. Separately, many typefaces lack proper OpenType `mark`/`mkmk` positioning tables for stacking diacritics under Hebrew letters, causing niqqud to render overlapping, offset, or detached from their base letter even when present. Unicode normalization (NFC/NFD) performed anywhere in the text pipeline (e.g. a build step, a CMS, copy-paste from a source document) can also reorder combining-mark sequences and disrupt correct niqqud stacking order.

**How to avoid:**
- Explicitly choose and bundle a web font verified to have complete niqqud + Hebrew mark/mkmk OpenType support (test candidates directly, don't assume system-default Hebrew fonts on iPadOS/Android are sufficient — verify on-device).
- Render every niqqud-bearing string as visual/glyph output that's been manually verified on real target devices (iPad Safari + Android Chrome tablet), not just verified in a code editor or design tool font preview.
- Keep niqqud content data as pre-normalized, single canonical Unicode form (pick NFC or NFD and be consistent) and avoid passing it through any tool/step that might silently re-normalize it (linters, CMS exports, copy-paste round-trips).
- Add a visual regression check (screenshot comparison) for the actual rendered niqqud glyphs on real devices as part of content/curriculum QA, since this class of bug produces no console error or exception — it just looks wrong.

**Warning signs:**
- Niqqud symbols look correct in the code editor / browser dev tools "computed" panel but visually absent or misplaced when the app is actually viewed on a tablet.
- Any content pipeline step that touches Hebrew text strings (e.g. a markdown/YAML parser, a build-time string transform) without explicit UTF-8/Unicode-normalization awareness.
- No specific web font chosen/bundled for niqqud rendering — relying on browser/OS default font stack alone.

**Phase to address:**
Level 1 curriculum content phase and visual redesign phase (font selection should happen early, since it affects every screen showing niqqud, and should be locked before curriculum content is finalized).

---

### Pitfall 7: Bidi (bidirectional text) rendering bugs from mixing Hebrew RTL with any LTR content

**What goes wrong:**
Any point where Latin-script/LTR content appears near Hebrew RTL content — a stage ID in a URL shown somewhere, a version number, a debug string, or (per this project's own documented constraint) inline English explanatory text mixed with Hebrew in the UI or even in code comments/docs — can trigger the Unicode Bidirectional Algorithm to reorder characters unexpectedly, especially around punctuation, parentheses, and numbers. This produces garbled, backwards, or reordered text that's confusing at best and, in a UI meant to be zero-reading-required, potentially misleading if it corrupts an icon label meant for a parent/caregiver setting up the app.

**Why it happens:**
The bidi algorithm resolves direction implicitly based on surrounding context and character types; without explicit `dir` attributes or Unicode directional isolate characters wrapping mixed content, the "natural" resolution frequently doesn't match the intended reading order — this is a well-documented, recurring class of bug across RTL web apps generally, not specific to any one framework. A common ineffective "fix" developers reach for is manually reversing a string, which breaks correct rendering further (it doesn't address the underlying algorithm and corrupts ligature/shaping in scripts that need it).

**How to avoid:**
- This project's own PROJECT.md constraint already correctly identifies the mitigation: avoid inline Hebrew-in-parentheses within English sentences in docs/UI copy; keep Hebrew on its own line/element; use explicit Unicode directional isolates (U+2067 RLI … U+2069 PDI) when inline mixing is genuinely unavoidable. Apply this consistently to *all* user-facing strings, not just documentation.
- Set `dir="rtl"` at the document root (already established per PROJECT.md) and `dir="auto"` on any input/dynamic-content element whose content direction isn't statically known.
- Never fix bidi issues via manual string reversal.
- Test any screen that could ever show a mix of Hebrew and non-Hebrew characters (numbers in stage counters, version strings, future settings/parent screens) specifically for bidi correctness — this needs native Hebrew-speaker or dedicated bidi-aware QA, since it's easy for an English-primary developer to miss visually.

**Warning signs:**
- Any hardcoded numeral, Latin-script debug string, or English label appearing adjacent to Hebrew text without an explicit `dir` boundary.
- Punctuation (parentheses, colons) placed directly adjacent to a Hebrew/English script boundary in any string.
- Testing done only on desktop browser — RTL bidi bugs disproportionately surface on mobile/tablet rendering and are easy to miss without cross-device checks.

**Phase to address:**
Ongoing across all phases (already partially mitigated by an established constraint in PROJECT.md) — but specifically re-verify at the icon-only navigation and visual redesign phase, since new UI surfaces (letter picker, back navigation) are the most likely place new mixed-content strings get introduced.

---

### Pitfall 8: Optimizing for "correct taps" instead of verifying actual sound-symbol learning

**What goes wrong:**
The game ships with satisfying tap-and-feedback mechanics, kids enjoy playing it and complete stages, but the underlying mastery-tracking logic doesn't actually confirm the child has learned the sound-to-symbol mapping — it just confirms they can pattern-match or guess well within the session. This is a well-documented failure mode across the broader educational-app-for-preschoolers market: apps are frequently built to keep children *active* rather than to verify they *understand*, and a correct tap is not proof of learning.

**Why it happens:**
Engagement metrics (taps, session length, streaks) are far easier to build and instrument than genuine-learning verification (which requires things like spaced repetition, randomized/non-positional answer placement, and testing retention after a delay, not just immediate accuracy). It's tempting to treat "8 trials at 80% accuracy" (the project's existing mastery threshold, per CONCERNS.md) as sufficient without considering *how* those trials were structured.

**How to avoid:**
- Ensure correct-answer position is randomized across trials (not always e.g. left-most option), so children can't learn "tap the left one" instead of learning the sound.
- Ensure the syllable pool for a given letter/sound is varied enough within a stage that a child can't succeed by memorizing "the third sound I heard was always X" — this is already partially covered by existing `usedSyllables` tracking logic per CONCERNS.md, but should be explicitly verified as a mastery-tracking design goal, not just a side effect.
- Be deliberately skeptical of the existing mastery-check edge case already flagged in CONCERNS.md (a child can be marked "mastered" after only 3 correct trials if all 3 happen to be correct, before `minTrials` is reached) — fix this bug now, since it directly undermines the "did they actually learn it" question this pitfall is about, not just a code-quality nit.
- Consider (even if deferred) some notion of delayed retention check (e.g. revisiting a "mastered" sound after other content, not just within one unbroken session) before treating level 1 as pedagogically validated — this can be deferred to a later milestone but should be a named gap, not silently absent.

**Warning signs:**
- Correct answer consistently appears in the same screen position across trials.
- Mastery threshold logic allows "mastered" status before the documented minimum trial count is reached (already an identified bug in CONCERNS.md).
- No variation mechanism preventing a child from succeeding via pattern memorization rather than sound recognition.

**Phase to address:**
Level 1 curriculum phase and mastery-logic fix (the existing `checkMastery` edge case in CONCERNS.md should be treated as a pedagogical-correctness bug for this milestone, not deferred as generic tech debt).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems for this specific project.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Use `<audio>` element instead of Web Audio API for syllable playback | Faster to wire up, simpler API | Perceptible tap-to-sound latency undermines the core phonics feedback loop; harder to retrofit low-latency scheduling later | Never for gameplay-trial sounds; acceptable only for genuinely non-critical audio (e.g. a one-off celebratory jingle where timing precision doesn't matter) |
| Draw distractors from all niqqud symbols rather than filtering by sound-group | Simpler trial-generation code | Actively teaches a false lesson (sound-identical niqqud presented as distinguishable), directly contradicts this project's core linguistic premise | Never — already flagged as a required fix in PROJECT.md Active requirements |
| In-memory-only progress state (no persistence) | Avoids storage/serialization complexity for the level-1 slice | Every session restart loses mastery progress; a caregiver can't tell if the child made progress yesterday | Acceptable explicitly for this milestone per PROJECT.md's stated Out of Scope, but should not silently persist into later milestones without a deliberate decision |
| Ship without real-device iPad Safari testing, rely on desktop Chrome only | Faster iteration during development | Autoplay/gesture-binding failures and font/niqqud rendering bugs are both device/browser-specific and invisible on desktop | Never acceptable before a phase is considered "done" — real-device check should be a standing acceptance gate for every phase touching audio, fonts, or touch targets |
| Rely on `aria-label` alone as an icon's sole disambiguator | Ticks an accessibility checkbox quickly | Provides zero benefit to the actual audience (a sighted, non-reading, non-screen-reader-using child); already flagged in CONCERNS.md for the current audio button | Acceptable as a *supplement* alongside color/motion/sound redundancy, never as the only differentiator |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Web Audio API on iOS | Creating/resuming `AudioContext` outside a user-gesture handler, or after an `await` inside the handler | Create one shared `AudioContext` on the app's very first tap; call `.resume()` synchronously inside that gesture handler; reuse it for the rest of the session |
| Service worker caching of audio files | Treating audio like any other static asset in a Workbox precache manifest; using `preload="metadata"` | Use a dedicated cache (separate from app-shell), `preload="none"`, and expect to handle HTTP range requests specially — media caching is meaningfully harder than caching JS/CSS/images |
| iOS Safari PWA storage | Assuming cached audio persists indefinitely once cached | iOS enforces ~50MB cache limits and can evict storage after ~7 days of the PWA being unused (or apply LRU eviction under storage pressure) unless the Persistent Storage API is requested; design for "audio might need to be re-fetched," don't assume permanent offline availability without explicit persistence handling |
| Hebrew web fonts | Assuming any font with Hebrew base-letter support also correctly renders niqqud | Explicitly verify niqqud + mark/mkmk OpenType support per candidate font, on real target devices, before locking in a typeface |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Fetching/decoding audio on-demand at tap time | First-play latency spikes, sound sometimes doesn't play in time for the child's expectation | Pre-load and pre-decode all audio for the active stage before showing the first trial | Immediately noticeable even at small content scale (5 stages); not a "scale" problem, a correctness problem from day one |
| Linear `.find()` lookups for stage/group data (already flagged in CONCERNS.md) | Slight slowdown as content grows | Map-based indexes | Currently negligible at 5 stages/groups; becomes worth fixing once level content expands beyond level 1 (e.g. full 22-letter, multi-sound curriculum) — not urgent for this milestone |

## Security Mistakes

Domain-specific issues beyond general web security — low risk for this project's actual scale, noted for completeness.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No validation of `stageId`/route params before lookup (already flagged in CONCERNS.md) | Low — currently degrades gracefully to `undefined`, but could cause confusing blank states for a child mid-play if a bad deep link is followed | Validate against known stage IDs; redirect home on mismatch, as already recommended in CONCERNS.md |
| No CSP headers (already flagged in CONCERNS.md) | Low at current scope (no user-generated content, no third-party scripts) | Add CSP headers via Vite config before any future integration that loads third-party content/scripts |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Negative feedback framed as failure/punishment (e.g. harsh error sound, X mark with no path forward) | Demotivates a 3-6-year-old, who may stop playing rather than try again | Frame incorrect taps as gentle "try again" cues (soft sound, encouraging animation) rather than punitive; always show a clear, icon-only path to retry |
| No repeated/replayable instruction cue after a pause in play | Child forgets what to do mid-session, especially given 8-10 minute attention spans, and gets stuck without being able to read a hint | Provide an always-available "replay" icon so the child can re-trigger the instructional/prompt sound at will, not just once per trial |
| Uniform single "kids 3-6" design target | A UI comfortable for a 6-year-old may be too fast-paced/complex for a 3-year-old, and vice versa | Acknowledge the wide developmental range within the target band explicitly during design; prefer generous timing, large targets, and simple flows calibrated toward the younger end, since that degrades gracefully for older kids but not the reverse |

## "Looks Done But Isn't" Checklist

- [ ] **Audio playback:** Works in desktop Chrome DevTools — verify it also plays on the very first tap in real iPad Safari, in standalone/installed PWA mode, not just in a regular browser tab.
- [ ] **Niqqud rendering:** Looks correct in the code editor/browser inspector — verify it renders correctly (no missing/misaligned marks) on the actual target font stack on a real iPad and Android tablet screen.
- [ ] **Distractor generation:** Trial options "look right" in casual manual testing — verify with an explicit automated test that no trial ever pairs two symbols from the same sound-group as correct-answer vs. distractor.
- [ ] **Icon-only navigation:** Icons render and are clickable — verify comprehension without any text/tooltip fallback, ideally checked with an actual child in the target age range, not just adult-developer assumption.
- [ ] **Mastery tracking:** Stage "completes" and shows a success state — verify the mastery-check boundary logic (existing known bug: can mark "mastered" before minTrials is reached) is fixed, since without it the completion signal is unreliable.
- [ ] **RTL layout:** Hebrew text and icons display right-to-left — verify no residual LTR-ordering bugs appear when any numeral, English string, or debug output is present anywhere on screen (including dev-only overlays that might leak into a build).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| Audio doesn't play on iOS after ship | LOW-MEDIUM | Move sound-trigger call into the tap handler synchronously; add a one-time `AudioContext` unlock on first app interaction; re-test on real device |
| Sound-identical niqqud presented as distractors after ship | LOW | Add sound-group filter to distractor selection; backfill a unit test; this is a pure logic fix, no data migration needed given no persistence yet |
| Niqqud glyphs found broken on a specific tablet/font combination post-launch | MEDIUM | Swap/bundle a verified-complete Hebrew font; may require re-testing all screens showing niqqud content, but is a targeted asset swap, not an architecture change |
| Mastery-check boundary bug discovered after some real usage | LOW (currently, since no persistence exists yet) | Fix the logic per CONCERNS.md's documented restructure; low cost precisely because there's no persisted historical data to migrate yet — cheaper to fix now than after persistence ships |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| iOS audio gesture/autoplay failure | Audio playback implementation phase | Manual test on real iPad Safari (installed PWA mode): first tap of a fresh session produces sound |
| Audio latency (`<audio>` vs Web Audio API) | Audio playback implementation phase | Sound triggers perceptibly instantly (<~50-100ms) after tap on real tablet hardware, not just fast dev machine |
| Sound-identical niqqud as distractors | Level 1 curriculum / trial-generation fix phase | Automated test: every generated trial's distractors belong to a different sound-group than the correct answer |
| Icon-only comprehension gaps | Icon-only navigation phase | No interactive element depends solely on `aria-label`/tooltip/text for meaning; informal comprehension check with target-age child if feasible |
| Touch targets too small/close for small hands | Visual redesign + letter-picker phase | Manual measurement/inspection of tappable element sizes and gaps against the ~2cm/64px guidance; test with an actual child if feasible |
| Niqqud font rendering failures | Level 1 curriculum content phase (font selection) | Visual check on real iPad + Android tablet screens, not just desktop browser, for every niqqud symbol used in content |
| Bidi/RTL mixed-content bugs | All phases touching new UI copy (icon-only nav, visual redesign) | Native-Hebrew-speaker or bidi-aware review of any screen where a numeral/Latin string could appear near Hebrew text |
| Mastery logic allows premature "mastered" status | Level 1 curriculum phase (fix already-identified `checkMastery` bug) | Unit tests covering all boundary conditions: below minTrials, at minTrials, at maxTrials, at/above/below accuracy threshold |
| Engagement (taps) mistaken for learning verification | Level 1 curriculum phase | Confirm correct-answer position is randomized per trial; confirm syllable/content variety prevents positional or sequence memorization |

## Sources

- [PWA iOS Limitations and Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — iOS storage quotas/eviction, MEDIUM confidence
- [Updates to Storage Policy | WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/) — Safari 17 storage policy, MEDIUM confidence
- [What we learned about PWAs and audio playback | Prototyped](https://medium.com/prototyped/what-we-learned-about-pwas-and-audio-playback-10a01c6aecbd) — iOS autoplay/gesture requirements, MEDIUM confidence
- [Autoplay policy in Chrome | Chrome for Developers](https://developer.chrome.com/blog/autoplay) — Chrome PWA autoplay behavior, MEDIUM confidence
- [HTML5 audio and the Web Audio API are BFFs | Chrome for Developers](https://developer.chrome.com/blog/html5-audio-and-the-web-audio-api-are-bffs) — latency/scheduling tradeoffs, MEDIUM confidence
- [Latency Of HTML5 audio Sounds - Robert O'Callahan](https://robert.ocallahan.org/2011/11/latency-of-html5-sounds.html) — `<audio>` latency characteristics, MEDIUM confidence
- [Children's UX: Usability Issues in Designing for Young People - NN/G](https://www.nngroup.com/articles/childrens-websites-usability-issues/) — kids UX pitfalls, MEDIUM confidence
- [Design for Kids Based on Their Stage of Physical Development - NN/G](https://www.nngroup.com/articles/children-ux-physical-development/) — touch target sizing guidance, MEDIUM confidence
- [Why Learning Apps Fail: The EdTech Problem Parents Miss](https://editorialge.com/why-learning-apps-fail/) — engagement-vs-learning distinction, MEDIUM confidence
- [Bad Teaching for Preschoolers? There Are Lots of Apps for That - EdWeek](https://www.edweek.org/teaching-learning/bad-teaching-for-preschoolers-there-are-lots-of-apps-for-that/2018/08) — feedback/instruction design gaps, MEDIUM confidence
- [Best Practices: Designing Touch Tablet Experiences for Preschoolers - Sesame Workshop / Joan Ganz Cooney Center](https://joanganzcooneycenter.org/wp-content/uploads/2020/02/SesameWorkshop-2012.pdf) — tablet UX for preschoolers, MEDIUM confidence
- [385622 – Hebrew diacritics (vowel points/nikud) disappear when missing from specified font - Bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=385622) — niqqud font-fallback failure, MEDIUM confidence (primary bug-tracker source)
- [Bug #880224 "Hebrew vowel diacritics are completely broken" - Ubuntu fonts-dejavu](https://bugs.launchpad.net/bugs/880224) — font-specific niqqud rendering breakage, MEDIUM confidence
- [Hebrew & Arabic RTL Localization: Design Challenges - TXL](https://www.txl.co.il/post/hebrew-arabic-rtl-localization-design-challenges-and-how-to-solve-them) — bidi/RTL mixed-content pitfalls, MEDIUM confidence
- [Minimal Pairs Speech Therapy Worksheets / auditory discrimination sources] — minimal-pairs teaching principle (don't co-teach untaught contrasts), MEDIUM confidence
- [GitHub - daffinm/audio-cache-test](https://github.com/daffinm/audio-cache-test) — PWA audio caching with Workbox, MEDIUM confidence
- `.planning/codebase/CONCERNS.md` — existing project-specific known issues (mastery-check edge case, missing accessibility on audio button, no distractor sound-group filtering), HIGH confidence (first-party codebase audit)
- `.planning/PROJECT.md` — project constraints and existing bidi-mitigation decision, HIGH confidence (first-party project doc)

---
*Pitfalls research for: Hebrew niqqud phonics learning PWA (Nikudon)*
*Researched: 2026-07-11*
