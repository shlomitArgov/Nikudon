import type { Page } from '@playwright/test'

const STAGE_URL = '/stage/stage-1'

export async function goToStage(page: Page): Promise<void> {
  await page.goto(STAGE_URL)
  await page.waitForSelector('.option-button')
}

export function progressText(page: Page): Promise<string> {
  return page.locator('.stage-progress').innerText()
}

/**
 * Taps options on the currently loaded trial, in order, until one resolves
 * as correct. The correct option is always among currentTrial.options, so
 * this always succeeds without needing to reload/regenerate the trial.
 * Earlier wrong taps on the same trial are harmless — they don't advance
 * or get counted until one lands correctly.
 */
export async function tapUntilCorrect(page: Page): Promise<void> {
  const buttons = page.locator('.option-button')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    await buttons.nth(i).click()
    await page.waitForTimeout(150)
    if (await page.locator('.option-button.correct').count()) return
  }
  throw new Error("No correct option found among this trial's buttons")
}

/**
 * Taps the first option that resolves as wrong on the currently loaded
 * trial, leaving it unresolved (not yet answered correctly).
 */
export async function tapWrong(page: Page): Promise<void> {
  const buttons = page.locator('.option-button')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    await buttons.nth(i).click()
    await page.waitForTimeout(150)
    if (await page.locator('.option-button.incorrect').count()) return
  }
  throw new Error("No wrong option found among this trial's buttons")
}
