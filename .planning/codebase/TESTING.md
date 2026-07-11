# Testing Patterns

**Analysis Date:** 2026-07-11

## Test Framework

**Runner:** Not detected

**Assertion Library:** Not detected

**Run Commands:** No test commands configured

**Status:** No testing framework is currently installed or configured. The project has no test files, no test runner configuration, and no test libraries in dependencies.

## Test File Organization

**Location:** Not applicable — no test infrastructure present

**Naming:** Not applicable — no test infrastructure present

**Structure:** Not applicable — no test infrastructure present

## Test Structure

**Suite Organization:** Not applicable — no test infrastructure present

**Patterns:** Not applicable — no test infrastructure present

## Mocking

**Framework:** Not applicable — no test infrastructure present

**Patterns:** Not applicable — no test infrastructure present

**What to Mock:** Not defined — no testing patterns established

**What NOT to Mock:** Not defined — no testing patterns established

## Fixtures and Factories

**Test Data:** Not applicable — no test infrastructure present

**Location:** Not applicable — no test infrastructure present

## Coverage

**Requirements:** Not enforced

**View Coverage:** Not applicable — no test infrastructure present

## Test Types

**Unit Tests:** Not implemented
- No test suite for utility functions (`generateTrial()`, `recordTrialResult()`, `checkMastery()`)
- No test suite for data access functions (`getStage()`, `getNikudGroup()`)

**Integration Tests:** Not implemented
- No tests for component interactions with game logic
- No tests for routing between pages

**E2E Tests:** Not implemented
- No end-to-end test framework configured

## Recommended Testing Architecture

### For Adding Tests

When implementing tests for this codebase, follow these recommendations based on the existing code structure:

**Unit Test Targets (High Priority):**
1. `src/engine/stageRunner.ts` — Game logic functions
   - `generateTrial()`: Verify correct group selection, option generation, syllable selection
   - `recordTrialResult()`: Verify state updates and accuracy calculation
   - `checkMastery()`: Verify mastery detection logic with various trial counts and accuracies

2. `src/content/stages.ts` — Stage retrieval functions
   - `getStage()`: Verify correct stage retrieval by ID
   - `getFirstStage()`: Verify returns first stage
   - `getNextStage()`: Verify progression logic

3. `src/content/nikudGroups.ts` — Data access functions
   - `getNikudGroup()`: Verify group retrieval
   - `getAllNikudGroupIds()`: Verify all IDs are returned

**Integration Test Targets (Medium Priority):**
1. Component rendering with game logic integration
   - `StagePlayer.tsx`: Verify trial generation, answer selection, feedback display
   - Navigation flow from `Home.tsx` to `StagePlayer.tsx`

**Component Test Pattern to Adopt:**
```typescript
// Recommended pattern when tests are added
describe('generateTrial', () => {
  it('should generate trial with correct group as option', () => {
    const stage = stages[0]
    const trial = generateTrial(stage)
    expect(trial.options).toContain(trial.correctGroupId)
  })

  it('should not repeat recent syllables', () => {
    const stage = stages[0]
    const usedSyllables = new Set(['בַּ'])
    const trial = generateTrial(stage, usedSyllables)
    expect(trial.audioSyllable).not.toBe('בַּ')
  })
})

describe('checkMastery', () => {
  it('should return false before minimum trials', () => {
    const progress = createStageProgress('stage-1')
    // Add 5 trials, all correct
    for (let i = 0; i < 5; i++) {
      const result = {
        trialId: `trial-${i}`,
        selectedGroupId: 'a' as const,
        correctGroupId: 'a' as const,
        isCorrect: true,
        timestamp: Date.now(),
      }
      recordTrialResult(progress, result)
    }
    // 5 < 8 minimum, so not mastered
    expect(checkMastery(progress)).toBe(false)
  })

  it('should return true with 8+ trials at 80% accuracy', () => {
    // Mastery: 10 trials, 8 correct = 80%
    const progress = createStageProgress('stage-1')
    const results = [
      { isCorrect: true }, { isCorrect: true }, { isCorrect: true },
      { isCorrect: true }, { isCorrect: true }, { isCorrect: true },
      { isCorrect: true }, { isCorrect: true }, { isCorrect: false },
      { isCorrect: false },
    ] as TrialResult[]
    
    results.forEach(r => recordTrialResult(progress, {
      trialId: `trial-${Math.random()}`,
      selectedGroupId: 'a' as const,
      correctGroupId: 'a' as const,
      timestamp: Date.now(),
      ...r,
    }))
    
    expect(checkMastery(progress)).toBe(true)
  })
})
```

### Recommended Test Runner Setup

When implementing testing infrastructure, consider:
- **Vitest** (recommended): Fast, Vite-native, TypeScript-first, minimal config
- **Jest**: Mature ecosystem, larger bundle, but familiar to many teams

**Suggested package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Critical Code Paths Without Tests

**High Risk:**
- Game logic (`src/engine/stageRunner.ts`): Complex trial generation and mastery calculation — any refactor risks breaking game mechanics
- State management: React component state updates (`setProgress`, `setCurrentTrial`, `setSelectedOption`) have no verification
- Trial result recording: Accumulation logic and accuracy calculations lack validation

**Medium Risk:**
- Data access functions: If data structure changes, no tests catch regressions
- Component interactions: Navigation and page transitions untested
- Edge cases: Empty syllable lists, invalid group IDs, boundary mastery conditions

## Error Handling Coverage Gaps

**Not tested:**
- Error thrown when invalid group ID passed to `generateTrial()` (line 75 in `stageRunner.ts`)
- Null/undefined handling in component render logic
- Edge case where review groups might be empty

---

*Testing analysis: 2026-07-11*
