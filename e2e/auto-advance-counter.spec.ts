import { expect, test } from '@playwright/test'
import { goToStage, progressText, tapUntilCorrect } from './helpers'

// Regression test for a stale-closure bug: the auto-advance chain (correct
// tap -> ~2s hold -> ~0.8s fade -> advance) used to call a handleForward
// closure captured at tap-time, whose view of `answers` was frozen before
// the tap had landed. By the time the timeout fired, it wrongly treated the
// just-answered trial as unanswered and overwrote the correct answer with a
// skip, degrading the counter from "1/1" back down to "0/1". Fixed via a
// ref that always points at the latest handleForward.
test('a correct answer still counts after the full auto-advance delay', async ({
  page,
}) => {
  await goToStage(page)
  await tapUntilCorrect(page)
  await expect(page.locator('.stage-progress')).toHaveText('1 / 1')

  // AUTO_ADVANCE_DELAY_MS (2000) + FADE_DURATION_MS (800) = 2800ms until
  // handleForward actually fires and the next trial settles in.
  await page.waitForTimeout(3200)

  expect(await progressText(page)).toBe('1 / 1')
})

test('two consecutive correct answers accumulate and hold', async ({ page }) => {
  await goToStage(page)
  await tapUntilCorrect(page)
  await page.waitForTimeout(3200) // ride out the auto-advance to trial 2
  await expect(page.locator('.stage-progress')).toHaveText('1 / 1')

  await tapUntilCorrect(page)
  await expect(page.locator('.stage-progress')).toHaveText('2 / 2')
  await page.waitForTimeout(3200)

  expect(await progressText(page)).toBe('2 / 2')
})
