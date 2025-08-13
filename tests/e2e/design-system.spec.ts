import { test, expect } from '@playwright/test'

test.describe('Design System Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design')
  })

  test('should load design system page', async ({ page }) => {
    await expect(page).toHaveTitle(/Design System/)
    await expect(page.locator('h1')).toContainText('Linear Design System')
  })

  test('should display search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search components..."]')
    await expect(searchInput).toBeVisible()
    
    // Test search functionality
    await searchInput.fill('button')
    await expect(page.locator('text=Button')).toBeVisible()
  })

  test('should display category filter', async ({ page }) => {
    const categorySelect = page.locator('select').first()
    await expect(categorySelect).toBeVisible()
    
    // Test category filtering
    await categorySelect.selectOption('form')
    await expect(page.locator('text=Form Components')).toBeVisible()
  })

  test('should show component sections', async ({ page }) => {
    // Form Components section
    await expect(page.locator('text=Form Components')).toBeVisible()
    await expect(page.locator('text=Feedback Components')).toBeVisible()
    await expect(page.locator('text=Layout Components')).toBeVisible()
    await expect(page.locator('text=Overlay Components')).toBeVisible()
  })

  test.describe('Button Component', () => {
    test('should display button variants', async ({ page }) => {
      // Check if button variants are visible
      await expect(page.locator('button:has-text("Primary")')).toBeVisible()
      await expect(page.locator('button:has-text("Secondary")')).toBeVisible()
      await expect(page.locator('button:has-text("Ghost")')).toBeVisible()
    })

    test('should display button sizes', async ({ page }) => {
      await expect(page.locator('button:has-text("Small")')).toBeVisible()
      await expect(page.locator('button:has-text("Medium")')).toBeVisible()
      await expect(page.locator('button:has-text("Large")')).toBeVisible()
    })

    test('should display button states', async ({ page }) => {
      await expect(page.locator('button:has-text("Loading")')).toBeVisible()
      await expect(page.locator('button:has-text("Disabled")')).toBeVisible()
      
      // Check if disabled button is actually disabled
      const disabledButton = page.locator('button:has-text("Disabled")')
      await expect(disabledButton).toBeDisabled()
    })

    test('should show loading spinner', async ({ page }) => {
      const loadingButton = page.locator('button:has-text("Loading")')
      await expect(loadingButton).toBeVisible()
      
      // Check if loading spinner is present
      await expect(loadingButton.locator('svg')).toBeVisible()
    })
  })

  test.describe('Input Component', () => {
    test('should display input variants', async ({ page }) => {
      // Navigate to inputs section or check if inputs are visible
      const defaultInput = page.locator('input[placeholder="Enter text..."]').first()
      await expect(defaultInput).toBeVisible()
      
      // Test input interaction
      await defaultInput.fill('Test input')
      await expect(defaultInput).toHaveValue('Test input')
    })

    test('should display error states', async ({ page }) => {
      // Look for input with error message
      await expect(page.locator('text=This field is required')).toBeVisible()
    })

    test('should handle disabled state', async ({ page }) => {
      const disabledInput = page.locator('input[disabled]')
      if (await disabledInput.count() > 0) {
        await expect(disabledInput.first()).toBeDisabled()
      }
    })
  })

  test.describe('Modal Component', () => {
    test('should open and close basic modal', async ({ page }) => {
      // Click button to open modal
      const openButton = page.locator('button:has-text("Basic Modal")')
      await expect(openButton).toBeVisible()
      await openButton.click()
      
      // Check if modal is open
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=Basic Modal')).toBeVisible()
      
      // Close modal by clicking X
      const closeButton = page.locator('[role="dialog"] button').first()
      await closeButton.click()
      
      // Check if modal is closed
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })

    test('should open modal with footer', async ({ page }) => {
      const openButton = page.locator('button:has-text("With Footer")')
      await openButton.click()
      
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=Confirm Action')).toBeVisible()
      
      // Check footer buttons
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
      await expect(page.locator('button:has-text("Confirm")')).toBeVisible()
      
      // Close by clicking Cancel
      await page.locator('button:has-text("Cancel")').click()
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })

    test('should close modal on backdrop click', async ({ page }) => {
      await page.locator('button:has-text("Basic Modal")').click()
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      
      // Click on backdrop (outside modal)
      await page.locator('.fixed.inset-0').click({ position: { x: 50, y: 50 } })
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })

    test('should close modal on escape key', async ({ page }) => {
      await page.locator('button:has-text("Basic Modal")').click()
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      
      // Press Escape key
      await page.keyboard.press('Escape')
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })
  })

  test.describe('Code Display', () => {
    test('should toggle code visibility', async ({ page }) => {
      // Find first code toggle button (usually the code icon)
      const codeToggleButton = page.locator('button').filter({ has: page.locator('[name="lucide:code"]') }).first()
      
      if (await codeToggleButton.count() > 0) {
        await codeToggleButton.click()
        
        // Check if code block appears
        await expect(page.locator('pre code')).toBeVisible()
        
        // Toggle again to hide
        await codeToggleButton.click()
        await expect(page.locator('pre code')).not.toBeVisible()
      }
    })

    test('should copy code to clipboard', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
      
      // Find copy button
      const copyButton = page.locator('button').filter({ has: page.locator('[name="lucide:copy"]') }).first()
      
      if (await copyButton.count() > 0) {
        await copyButton.click()
        
        // Check for success toast (if it appears)
        const successToast = page.locator('text=Code copied to clipboard!')
        if (await successToast.count() > 0) {
          await expect(successToast).toBeVisible()
        }
      }
    })
  })

  test.describe('Alert Component', () => {
    test('should display alert variants', async ({ page }) => {
      await expect(page.locator('text=Default Alert')).toBeVisible()
      await expect(page.locator('text=Success!')).toBeVisible()
      await expect(page.locator('text=Warning')).toBeVisible()
      await expect(page.locator('text=Error')).toBeVisible()
      await expect(page.locator('text=Information')).toBeVisible()
    })

    test('should display alert icons', async ({ page }) => {
      // Check if alert components have icons
      const alertElements = page.locator('[role="alert"]')
      const count = await alertElements.count()
      
      for (let i = 0; i < count; i++) {
        const alert = alertElements.nth(i)
        await expect(alert.locator('svg')).toBeVisible()
      }
    })
  })

  test.describe('Badge Component', () => {
    test('should display badge variants', async ({ page }) => {
      await expect(page.locator('text=Default').first()).toBeVisible()
      await expect(page.locator('text=Success').first()).toBeVisible()
      await expect(page.locator('text=Warning').first()).toBeVisible()
      await expect(page.locator('text=Error').first()).toBeVisible()
      await expect(page.locator('text=Info').first()).toBeVisible()
      await expect(page.locator('text=Outline').first()).toBeVisible()
    })
  })

  test.describe('Progress Component', () => {
    test('should display progress bars', async ({ page }) => {
      // Look for progress elements or progress-like divs
      const progressBars = page.locator('[role="progressbar"]')
      const count = await progressBars.count()
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          await expect(progressBars.nth(i)).toBeVisible()
        }
      }
    })
  })

  test.describe('Card Component', () => {
    test('should display card variants', async ({ page }) => {
      await expect(page.locator('text=Default Card')).toBeVisible()
      await expect(page.locator('text=Outlined Card')).toBeVisible()
      await expect(page.locator('text=Elevated Card')).toBeVisible()
    })

    test('should display card actions', async ({ page }) => {
      // Look for action buttons in cards
      const cardActions = page.locator('text=Action')
      if (await cardActions.count() > 0) {
        await expect(cardActions.first()).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Check if main content is still visible
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('text=Form Components')).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('text=Form Components')).toBeVisible()
    })

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('text=Form Components')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Check for h1
      await expect(page.locator('h1')).toBeVisible()
      
      // Check for h2 (section headings)
      const h2Elements = page.locator('h2')
      const h2Count = await h2Elements.count()
      expect(h2Count).toBeGreaterThan(0)
    })

    test('should have proper button accessibility', async ({ page }) => {
      const buttons = page.locator('button')
      const count = await buttons.count()
      
      // Check that buttons are focusable and have accessible names
      for (let i = 0; i < Math.min(count, 5); i++) { // Check first 5 buttons
        const button = buttons.nth(i)
        await expect(button).toBeVisible()
        
        // Check if button can be focused
        await button.focus()
        await expect(button).toBeFocused()
      }
    })

    test('should have proper input labels', async ({ page }) => {
      const inputs = page.locator('input[type="text"], input[type="email"]')
      const count = await inputs.count()
      
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i)
        const inputId = await input.getAttribute('id')
        
        if (inputId) {
          // Check if there's a corresponding label
          const label = page.locator(`label[for="${inputId}"]`)
          await expect(label).toBeVisible()
        }
      }
    })

    test('should support keyboard navigation', async ({ page }) => {
      // Test Tab navigation through interactive elements
      await page.keyboard.press('Tab')
      const firstFocusable = await page.evaluate(() => document.activeElement?.tagName)
      expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(firstFocusable)
      
      // Continue tabbing to next element
      await page.keyboard.press('Tab')
      const secondFocusable = await page.evaluate(() => document.activeElement?.tagName)
      expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(secondFocusable)
    })
  })

  test.describe('Performance', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/design')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should not have console errors', async ({ page }) => {
      const consoleErrors: string[] = []
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      await page.goto('/design')
      await page.waitForLoadState('networkidle')
      
      // Filter out known acceptable errors (if any)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('network') &&
        !error.includes('404')
      )
      
      expect(criticalErrors).toHaveLength(0)
    })
  })
})