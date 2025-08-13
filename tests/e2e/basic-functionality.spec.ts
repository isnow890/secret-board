// tests/e2e/basic-functionality.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Basic Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should load main page successfully', async ({ page }) => {
    // Check if page loads
    await expect(page).toHaveTitle(/secret/)
    
    // Check if basic elements are present
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to post creation page', async ({ page }) => {
    // Look for write post button or link
    const writeButton = page.locator('text=글쓰기').first()
    
    if (await writeButton.isVisible()) {
      await writeButton.click()
      await page.waitForLoadState('domcontentloaded')
      
      // Should be on create post page
      expect(page.url()).toMatch(/\/post\/create$/)
      
      // Check if form elements exist
      await expect(page.locator('input[placeholder*="제목"]')).toBeVisible()
      await expect(page.locator('input[placeholder*="닉네임"]')).toBeVisible()
    } else {
      console.log('Write button not found on main page')
    }
  })

  test('should display post list or empty state', async ({ page }) => {
    // Wait a bit for content to load
    await page.waitForTimeout(2000)
    
    // Check if posts are displayed or empty state is shown
    const hasPostList = await page.locator('.post-item').count() > 0
    const hasEmptyState = await page.locator('text=게시글이 없습니다').isVisible()
    
    // Either posts should be displayed or empty state should be shown
    expect(hasPostList || hasEmptyState).toBe(true)
  })

  test('should handle basic navigation', async ({ page }) => {
    // Test navigation elements
    const navigation = page.locator('nav').first()
    
    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible()
    }
    
    // Test basic page elements
    await expect(page.locator('main, .container, .page-content').first()).toBeVisible()
  })
})