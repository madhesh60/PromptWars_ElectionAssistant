/**
 * @file example.spec.js
 * @description Playwright E2E smoke tests for the Electo frontend.
 *              Tests critical UI elements, navigation, accessibility, and
 *              keyboard interaction — all without a live backend.
 */
const { test, expect } = require('@playwright/test')
const path = require('path')

// Serve the local HTML file as a static page
const HTML_PATH = `file://${path.join(__dirname, '../frontend/index.html')}`

test.describe('🌐 Electo Frontend — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend API calls to prevent errors during static tests
    await page.route('**/api/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: 'Mocked backend response' }),
      })
    )
    await page.goto(HTML_PATH)
  })

  // ──────────────────────────────────────────────
  // Page Load & Metadata
  // ──────────────────────────────────────────────
  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Electo/i)
  })

  test('has skip-to-main-content link for accessibility', async ({ page }) => {
    const skipLink = page.locator('.skip-link')
    await expect(skipLink).toBeAttached()
  })

  test('has a main content landmark', async ({ page }) => {
    const main = page.locator('#main-content')
    await expect(main).toBeVisible()
  })

  // ──────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────
  test('sidebar has all navigation links', async ({ page }) => {
    const navIds = [
      '#nav-chat',
      '#nav-analyzer',
      '#nav-bias',
      '#nav-rep',
      '#nav-constitution',
      '#nav-timeline',
      '#nav-reminders',
      '#nav-learn',
    ]
    for (const id of navIds) {
      await expect(page.locator(id)).toBeAttached()
    }
  })

  test('clicking Bias Detector nav shows bias view', async ({ page }) => {
    await page.click('#nav-bias')
    const biasView = page.locator('#view-bias')
    await expect(biasView).toBeVisible()
  })

  test('clicking Who Represents Me shows rep view', async ({ page }) => {
    await page.click('#nav-rep')
    const repView = page.locator('#view-rep')
    await expect(repView).toBeVisible()
  })

  test('clicking Ask the Constitution shows constitution view', async ({ page }) => {
    await page.click('#nav-constitution')
    const constView = page.locator('#view-constitution')
    await expect(constView).toBeVisible()
  })

  test('clicking How India Votes shows learn view', async ({ page }) => {
    await page.click('#nav-learn')
    const learnView = page.locator('#view-learn')
    await expect(learnView).toBeVisible()
  })

  // ──────────────────────────────────────────────
  // Chat Interface
  // ──────────────────────────────────────────────
  test('chat input is present and focusable', async ({ page }) => {
    const chatInput = page.locator('#chat-input')
    await expect(chatInput).toBeVisible()
    await chatInput.focus()
    await expect(chatInput).toBeFocused()
  })

  test('send button is present', async ({ page }) => {
    const sendBtn = page.locator('#chat-send-btn')
    await expect(sendBtn).toBeVisible()
  })

  test('attach button is present', async ({ page }) => {
    const attachBtn = page.locator('#chat-attach-btn')
    await expect(attachBtn).toBeVisible()
  })

  test('welcome message shows on initial load', async ({ page }) => {
    const welcome = page.locator('#welcome-message')
    await expect(welcome).toBeVisible()
  })

  // ──────────────────────────────────────────────
  // Accessibility
  // ──────────────────────────────────────────────
  test('all form inputs have aria-labels or associated labels', async ({ page }) => {
    const inputs = await page.locator('input, textarea').all()
    for (const input of inputs) {
      // Skip hidden inputs
      const isVisible = await input.isVisible()
      if (!isVisible) continue
      const ariaLabel = await input.getAttribute('aria-label')
      const id = await input.getAttribute('id')
      const labelCount = id ? await page.locator(`label[for="${id}"]`).count() : 0
      expect(ariaLabel || labelCount > 0).toBeTruthy()
    }
  })

  test('all buttons have aria-labels or text content', async ({ page }) => {
    const buttons = await page.locator('button').all()
    for (const btn of buttons) {
      const label = await btn.getAttribute('aria-label')
      const text = (await btn.textContent()).trim()
      expect(label || text.length > 0).toBeTruthy()
    }
  })

  test('sidebar nav items are keyboard-navigable', async ({ page }) => {
    await page.keyboard.press('Tab')
    // Focus should move to an interactive element
    const focused = page.locator(':focus')
    await expect(focused).toBeAttached()
  })

  // ──────────────────────────────────────────────
  // Dark Mode
  // ──────────────────────────────────────────────
  test('page has dark mode class on body', async ({ page }) => {
    const body = page.locator('body')
    const cls = await body.getAttribute('class')
    expect(cls).toContain('theme-dark')
  })

  // ──────────────────────────────────────────────
  // Critical UI Sections
  // ──────────────────────────────────────────────
  test('sidebar is present', async ({ page }) => {
    await expect(page.locator('aside.sidebar')).toBeVisible()
  })

  test('logo text "Electo" is visible', async ({ page }) => {
    const logo = page.locator('.logo-text')
    await expect(logo).toContainText('Electo')
  })

  test('Bias Detector has submit button', async ({ page }) => {
    await page.click('#nav-bias')
    const biasSubmit = page.locator('#bias-submit')
    await expect(biasSubmit).toBeVisible()
  })

  test('Constitution view has input and submit', async ({ page }) => {
    await page.click('#nav-constitution')
    await expect(page.locator('#const-input')).toBeVisible()
    await expect(page.locator('#const-submit')).toBeVisible()
  })

  test('Represent view has input and submit', async ({ page }) => {
    await page.click('#nav-rep')
    await expect(page.locator('#rep-input')).toBeVisible()
    await expect(page.locator('#rep-submit')).toBeVisible()
  })
})
