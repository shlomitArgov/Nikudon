# Codebase Concerns

**Analysis Date:** 2026-07-11

## Tech Debt

### Audio Playback Not Implemented

**Issue:** Core game mechanic relies on audio playback, but implementation is missing. Currently shows placeholder alert.

**Files:** `src/pages/StagePlayer.tsx` (line 96)

**Impact:** Users cannot hear the audio syllables that they're meant to identify. Game is completely non-functional for its primary purpose.

**Fix approach:**
- Implement Web Audio API or HTML5 `<audio>` element with syllable files
- Create audio service in `src/engine/` to manage playback
- Generate or source Hebrew syllable pronunciation files (.mp3 or .ogg format)
- Add audio loading and error handling

### No Data Persistence

**Issue:** Progress tracking exists in component state only. All progress is lost on page refresh or app closure.

**Files:** `src/pages/StagePlayer.tsx` (lines 18-24), `src/engine/stageRunner.ts` (creates StageProgress)

**Impact:** Users lose all learning progress; poor user experience for educational app; no cross-session learning continuity.

**Fix approach:**
- Implement localStorage persistence for StageProgress objects
- Create persistence service in `src/engine/`
- Serialize/deserialize progress data safely
- Consider IndexedDB for larger datasets if needed later

### Unsafe Type Casting

**Issue:** Use of `as any` bypass in TypeScript code, removing type safety.

**Files:** `src/pages/StagePlayer.tsx` (line 43)

**Impact:** Potential runtime errors if types don't match; reduces ability to catch bugs at compile time.

**Fix approach:**
- Remove `as any` cast on line 43
- Ensure TrialResult type properly matches result object structure
- Use proper type definitions instead of casting

### No Error Boundaries

**Issue:** No React Error Boundary components to catch rendering errors gracefully.

**Files:** `src/App.tsx`, `src/pages/StagePlayer.tsx`, `src/pages/Home.tsx`

**Impact:** Unhandled errors crash the entire app; poor user experience.

**Fix approach:**
- Create ErrorBoundary component in `src/components/ErrorBoundary.tsx`
- Wrap App and route components with error boundary
- Display user-friendly error message with recovery option

## Known Issues

### Weak Trial ID Generation

**Issue:** Trial IDs use `Date.now()` with Math.random(), but collisions are theoretically possible with rapid trial generation.

**Files:** `src/engine/stageRunner.ts` (line 107)

**Impact:** Potential trial ID collisions could cause incorrect result tracking in edge cases.

**Fix approach:**
- Use crypto.randomUUID() or a robust UUID library
- Or use incremental counter per session plus random component
- Document the trial ID generation strategy

### Ambiguous Navigation Default

**Issue:** Route `/stage` without stageId parameter defaults to first stage, but this behavior isn't well-documented or tested.

**Files:** `src/App.tsx` (line 12), `src/pages/StagePlayer.tsx` (line 17)

**Impact:** Users could accidentally skip stages; unclear behavior if they bookmark/share incomplete URLs.

**Fix approach:**
- Either remove the ambiguous `/stage` route
- Or redirect `/stage` to `/` to force stage selection
- Document why this route exists if it has a purpose

### Hardcoded Language and Alerts

**Issue:** Success message uses hardcoded Hebrew alert; no i18n infrastructure.

**Files:** `src/pages/StagePlayer.tsx` (line 56)

**Impact:** Non-Hebrew speakers cannot understand completion message; future localization would be difficult.

**Fix approach:**
- Move alert to a proper UI component instead of browser alert
- Create i18n/translation system if multi-language support needed
- Or at minimum extract strings to constants

### Missing Accessibility in Audio Button

**Issue:** Play audio button relies only on emoji icon (🔊) without sufficient text alternative.

**Files:** `src/pages/StagePlayer.tsx` (line 96)

**Impact:** Screen reader users might not understand button purpose; keyboard-only users may struggle.

**Fix approach:**
- Ensure aria-label is semantically meaningful ("Play audio pronunciation")
- Make button keyboard accessible (should already work, verify)
- Consider adding visible text alongside emoji for clarity

## Performance Bottlenecks

### Linear Search for Stage/Group Lookups

**Issue:** Stage and NikudGroup lookups use `.find()` on arrays, requiring O(n) searches on every access.

**Files:** `src/content/stages.ts` (lines 54-56, 68-74), `src/content/nikudGroups.ts` (lines 51-53)

**Impact:** Minor impact now (only 5 stages, 5 groups), but doesn't scale. Could slow down with more content.

**Fix approach:**
- Create Map-based indexes in content files
- Or use object keys for constant-time O(1) lookups
- Not urgent but good refactoring for scalability

### Set Operations on Every Trial

**Issue:** usedSyllables Set is created fresh in filter operation; doesn't optimize for large pools.

**Files:** `src/engine/stageRunner.ts` (lines 79-87)

**Impact:** Minimal performance impact now, but unnecessary object allocation on each trial.

**Fix approach:**
- Keep Set reference stable; don't recreate unnecessarily
- Consider if syllable cycling is necessary (might repeat more elegantly)

## Fragile Areas

### Stage Configuration Brittleness

**Issue:** Stage configuration is tightly coupled to NikudGroup IDs; no validation that referenced groups exist.

**Files:** `src/content/stages.ts` (lines 19-48), uses NikudGroupIds

**Impact:** If group IDs change in nikudGroups.ts, stages silently break at runtime.

**Fix approach:**
- Add validation function that runs at startup to verify all referenced groups exist
- Use strict type system to prevent mismatched IDs
- Add unit tests for stage/group consistency

### Mastery Logic Edge Case

**Issue:** The mastery check has confusing control flow. Line 133-134 can return true even if minTrials not met if accuracy is high.

**Files:** `src/engine/stageRunner.ts` (lines 117-135)

**Impact:** Users could be marked as mastered after just 3 correct trials (if all 3 are correct, accuracy = 100% > 80%), before completing minTrials (8).

**Fix approach:**
- Restructure logic to be clearer:
  ```
  1. Check if trialsCompleted < minTrials → always return false
  2. Check if trialsCompleted >= maxTrials → return accuracy >= required
  3. Check if accuracy >= required → return true
  4. Otherwise → return false
  ```
- Add comprehensive unit tests for boundary cases

### UI State Synchronization

**Issue:** Multiple setState calls in StagePlayer component; potential for state inconsistencies if effects don't fire in expected order.

**Files:** `src/pages/StagePlayer.tsx` (lines 27-33, 61-69)

**Impact:** Could show feedback without proper trial state; edge cases with rapid interactions.

**Fix approach:**
- Consider using useReducer for complex state management
- Add invariant checks to catch impossible states
- Test with rapid user interactions (spamming buttons)

## Security Considerations

### No Input Validation on Route Parameters

**Issue:** stageId from URL params used directly without validation.

**Files:** `src/pages/StagePlayer.tsx` (line 16)

**Impact:** Malformed stageId falls through to getStage() which returns undefined gracefully, but no explicit validation.

**Fix approach:**
- Validate stageId matches known stage IDs before use
- Add type guard or schema validation (Zod/Yup)
- Redirect to home if invalid stage requested

### No Content Security Policy

**Issue:** No CSP headers defined in vite config; relies on default browser behavior.

**Files:** `vite.config.ts`, index.html (not visible)

**Impact:** Slightly more vulnerable to XSS if user-generated content added later.

**Fix approach:**
- Add CSP headers via vite configuration
- Define what resources can be loaded (scripts, styles, audio, etc.)

## Test Coverage Gaps

### No Unit Tests for Game Logic

**Issue:** Core game logic has zero test coverage. No tests for trial generation, mastery calculation, or progress tracking.

**Files:** 
- `src/engine/stageRunner.ts` - entire file untested
- `src/content/stages.ts` - untested
- `src/content/nikudGroups.ts` - untested

**Risk:** High. Changes to mastery logic, trial generation, or stage configuration could silently break core functionality.

**Priority:** High

**Fix approach:**
- Set up vitest or jest configuration
- Add test suites for:
  - generateTrial: correctness of options, syllable selection
  - checkMastery: all boundary conditions (minTrials, maxTrials, accuracy thresholds)
  - recordTrialResult: state updates
  - Stage/group lookup functions: error cases

### No Component Integration Tests

**Issue:** StagePlayer component logic (state transitions, feedback display) not tested.

**Files:** `src/pages/StagePlayer.tsx`

**Risk:** Medium. UI bugs could exist around trial progression, feedback timing, and mastery detection.

**Priority:** Medium

**Fix approach:**
- Add integration tests using React Testing Library
- Test user flows: select option → see feedback → next trial
- Test mastery trigger at boundaries

### No E2E Tests

**Issue:** No end-to-end tests verifying full game flow from start to completion.

**Files:** N/A

**Risk:** Medium. Features could break in ways that unit tests miss.

**Priority:** Medium

**Fix approach:**
- Set up Playwright or Cypress if needed
- Create basic E2E flow test: start app → play stage → achieve mastery → verify UI

## Missing Critical Features

### Audio Files

**Problem:** App cannot run without audio syllable recordings.

**Blocks:** Entire game is unplayable without audio implementation.

**Files Affected:** `src/pages/StagePlayer.tsx`, `src/engine/stageRunner.ts`

**Priority:** Critical

### Progress Persistence

**Problem:** All progress lost on reload.

**Blocks:** Practical educational use; users lose motivation.

**Files Affected:** `src/pages/StagePlayer.tsx`, `src/engine/stageRunner.ts`

**Priority:** High

### Stage Progression UI

**Problem:** No way for users to see or access stages other than starting from stage 1.

**Blocks:** Users cannot review completed stages or skip to later content.

**Files Affected:** `src/pages/Home.tsx`, `src/App.tsx`

**Priority:** Medium

---

*Concerns audit: 2026-07-11*
