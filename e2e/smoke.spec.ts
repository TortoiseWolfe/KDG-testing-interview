import { test, expect } from '@playwright/test'

test('homepage renders customer table with seeded data', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('KDG Customers')
  await expect(page.locator('table')).toBeVisible()
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(100)
})

test('table has Name and Email columns', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('th').nth(0)).toHaveText('Name')
  await expect(page.locator('th').nth(1)).toHaveText('Email')
})
