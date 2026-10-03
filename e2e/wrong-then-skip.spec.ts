import { expect, test } from '@playwright/test'
import { goToStage, progressText, tapWrong } from './helpers'

// Regression test: tapping a wrong option and then moving on without ever
// getting it right used to leave the trial stuck as
// {selectedGroupId: wrongId, isCorrect: false} forever — a shape the X / Y
// total formula deliberately excludes (not correct, not a skip) — so it
// silently vanished from the total instead of counting as a skip.
test('a wrong answer, then skipped without retrying, still counts in the total', async ({
  page,
}) => {
  await goToStage(page)
  await tapWrong(page)
  await expect(page.locator('.stage-progress')).toHaveText('0 / 0') // held back, not yet counted

  await page.click('.nav-forward')
  await expect(page.locator('.stage-progress')).toHaveText('0 / 1') // now counts as a skip
})

test('revisiting an abandoned wrong answer without re-answering does not double-count it', async ({
  page,
}) => {
  await goToStage(page)
  await tapWrong(page)
  await page.click('.nav-forward')
  await expect(page.locator('.stage-progress')).toHaveText('0 / 1')

  await page.click('.nav-back')
  await page.click('.nav-forward')

  expect(await progressText(page)).toBe('0 / 1')
})

test('the abandoned trial shows as skipped, not revealing the correct answer', async ({
  page,
}) => {
  await goToStage(page)
  await tapWrong(page)
  await page.click('.nav-forward')
  await page.click('.nav-back')

  await expect(page.locator('.position-status')).toHaveClass(/status-skipped/)
  expect(await page.locator('.option-button.correct-reveal').count()).toBe(0)
})
