import { expect, test } from '@playwright/test'

// The seed script creates these demo users (backend/src/seed.js).
const PASSWORD = 'Password123!'

async function login(page, email) {
  await page.goto('/')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

// A date in the current week, so the new event is visible without paging.
function dateInCurrentWeek() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

test('M3: a parent adds an event and sees it in the weekly view', async ({ page }) => {
  await login(page, 'parent@childconnect.test')
  await expect(page.getByTestId('parent-home')).toBeVisible()

  const schedule = page.getByTestId('weekly-schedule')
  await expect(schedule).toBeVisible()
  // The seed script put two events into the current week.
  await expect(schedule.getByTestId('event').first()).toBeVisible()

  const form = schedule.getByTestId('event-form')
  await form.getByLabel('Event title').fill('Swimming lesson')
  await form.getByLabel('Event date').fill(dateInCurrentWeek())
  await form.getByLabel('Start time').fill('16:00')
  await form.getByLabel('End time').fill('17:00')
  await form.getByRole('button', { name: 'Add event' }).click()

  await expect(schedule.getByTestId('event').filter({ hasText: 'Swimming lesson' })).toBeVisible()
})

test('M3: the form shows an error when the end time is not after the start time', async ({ page }) => {
  await login(page, 'parent@childconnect.test')

  const form = page.getByTestId('weekly-schedule').getByTestId('event-form')
  await form.getByLabel('Event title').fill('Impossible event')
  await form.getByLabel('Event date').fill(dateInCurrentWeek())
  await form.getByLabel('Start time').fill('15:00')
  await form.getByLabel('End time').fill('14:00')
  await form.getByRole('button', { name: 'Add event' }).click()

  await expect(form.getByRole('alert')).toContainText('End time must be after start time')
})

test('M3: the child sees the weekly schedule read-only and can change weeks', async ({ page }) => {
  await login(page, 'child@childconnect.test')
  await expect(page.getByTestId('child-home')).toBeVisible()

  const schedule = page.getByTestId('weekly-schedule')
  await expect(schedule.getByTestId('event').first()).toBeVisible()

  // Read-only: no add form and no delete buttons (FR-M3-04).
  await expect(schedule.getByTestId('event-form')).toHaveCount(0)
  await expect(schedule.getByRole('button', { name: 'Delete' })).toHaveCount(0)

  // Next week has no events; going back shows them again (FR-M3-03).
  const label = schedule.getByTestId('week-label')
  const thisWeek = await label.textContent()
  await schedule.getByRole('button', { name: 'Next week' }).click()
  await expect(label).not.toHaveText(thisWeek)
  await expect(schedule.getByTestId('event')).toHaveCount(0)
  await schedule.getByRole('button', { name: 'Previous week' }).click()
  await expect(label).toHaveText(thisWeek)
  await expect(schedule.getByTestId('event').first()).toBeVisible()
})
