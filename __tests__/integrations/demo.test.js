/* eslint-disable no-undef */

/**
 * @jest-environment puppeteer
 */
import 'expect-puppeteer'

// no-undef added because of page.
// It is apparently automatically exposed in the context of puppeteer
describe('Local', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3333')
  })

  it('should display "General Coordinates Network" text on page', async () => {
    await expect(page).toMatchTextContent('General Coordinates Network')
  })
})
