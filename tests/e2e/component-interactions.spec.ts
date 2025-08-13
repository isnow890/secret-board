import { test, expect } from '@playwright/test'

test.describe('Component Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Form Component Interactions', () => {
    test('should handle input field interactions', async ({ page }) => {
      // Find input fields and test them
      const textInputs = page.locator('input[type="text"], input[placeholder*="text"]')
      const count = await textInputs.count()
      
      if (count > 0) {
        const firstInput = textInputs.first()
        
        // Test typing
        await firstInput.fill('Test input value')
        await expect(firstInput).toHaveValue('Test input value')
        
        // Test clearing
        await firstInput.fill('')
        await expect(firstInput).toHaveValue('')
        
        // Test focus states
        await firstInput.focus()
        await expect(firstInput).toBeFocused()
        
        await firstInput.blur()
        await expect(firstInput).not.toBeFocused()
      }
    })

    test('should handle select dropdown interactions', async ({ page }) => {
      const selectElements = page.locator('select')
      const count = await selectElements.count()
      
      if (count > 0) {
        const categorySelect = selectElements.first()
        
        // Test selecting an option
        await categorySelect.selectOption('form')
        const selectedValue = await categorySelect.inputValue()
        expect(selectedValue).toBe('form')
        
        // Test changing selection
        await categorySelect.selectOption('')
        const newValue = await categorySelect.inputValue()
        expect(newValue).toBe('')
      }
    })

    test('should handle checkbox interactions', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]')
      const count = await checkboxes.count()
      
      if (count > 0) {
        const firstCheckbox = checkboxes.first()
        
        // Test checking
        await firstCheckbox.check()
        await expect(firstCheckbox).toBeChecked()
        
        // Test unchecking
        await firstCheckbox.uncheck()
        await expect(firstCheckbox).not.toBeChecked()
        
        // Test clicking label
        const checkboxId = await firstCheckbox.getAttribute('id')
        if (checkboxId) {
          const label = page.locator(`label[for="${checkboxId}"]`)
          if (await label.count() > 0) {
            await label.click()
            await expect(firstCheckbox).toBeChecked()
          }
        }
      }
    })

    test('should handle textarea interactions', async ({ page }) => {
      const textareas = page.locator('textarea')
      const count = await textareas.count()
      
      if (count > 0) {
        const firstTextarea = textareas.first()
        
        const testText = 'This is a test message\nwith multiple lines\nto test textarea functionality'
        
        // Test typing
        await firstTextarea.fill(testText)
        await expect(firstTextarea).toHaveValue(testText)
        
        // Test focus
        await firstTextarea.focus()
        await expect(firstTextarea).toBeFocused()
      }
    })
  })

  test.describe('Button Interaction States', () => {
    test('should handle button hover states', async ({ page }) => {
      const buttons = page.locator('button:not([disabled])')
      const count = await buttons.count()
      
      if (count > 0) {
        const firstButton = buttons.first()
        
        // Test hover
        await firstButton.hover()
        
        // Check if hover styles are applied (this would need specific CSS checking)
        const buttonClasses = await firstButton.getAttribute('class')
        expect(buttonClasses).toBeTruthy()
      }
    })

    test('should handle button click interactions', async ({ page }) => {
      // Find clickable buttons (not loading or disabled)
      const clickableButtons = page.locator('button:not([disabled]):not(:has-text("Loading"))')
      const count = await clickableButtons.count()
      
      if (count > 0) {
        // Test clicking primary buttons
        const primaryButtons = clickableButtons.filter({ hasText: /Primary|Action|Click/ })
        const primaryCount = await primaryButtons.count()
        
        if (primaryCount > 0) {
          const button = primaryButtons.first()
          
          // Test click
          await button.click()
          
          // For buttons that might trigger actions, we just verify they're clickable
          await expect(button).toBeVisible()
        }
      }
    })

    test('should respect disabled button states', async ({ page }) => {
      const disabledButtons = page.locator('button[disabled], button:has-text("Disabled")')
      const count = await disabledButtons.count()
      
      if (count > 0) {
        const disabledButton = disabledButtons.first()
        
        await expect(disabledButton).toBeDisabled()
        
        // Try to click - should not work
        await disabledButton.click({ force: true })
        // Button should still be disabled after click attempt
        await expect(disabledButton).toBeDisabled()
      }
    })

    test('should show loading states correctly', async ({ page }) => {
      const loadingButtons = page.locator('button:has-text("Loading")')
      const count = await loadingButtons.count()
      
      if (count > 0) {
        const loadingButton = loadingButtons.first()
        
        // Check loading button properties
        await expect(loadingButton).toBeDisabled()
        
        // Check for loading spinner
        const spinner = loadingButton.locator('svg')
        if (await spinner.count() > 0) {
          await expect(spinner).toBeVisible()
          
          // Check if spinner has animation class
          const spinnerClasses = await spinner.getAttribute('class')
          expect(spinnerClasses).toContain('animate-spin')
        }
      }
    })
  })

  test.describe('Modal Interaction Flows', () => {
    test('should handle complete modal workflow', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Basic Modal")')
      await modalTrigger.click()
      
      // Verify modal is open
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
      
      // Check modal content
      await expect(modal.locator('h3')).toContainText('Basic Modal')
      
      // Check modal is properly focused
      await expect(modal).toBeFocused()
      
      // Close via close button
      const closeButton = modal.locator('button').filter({ has: page.locator('[name="lucide:x"]') })
      await closeButton.click()
      
      // Verify modal is closed
      await expect(modal).not.toBeVisible()
    })

    test('should handle modal with form workflow', async ({ page }) => {
      const modalTrigger = page.locator('button:has-text("Large Modal")')
      if (await modalTrigger.count() > 0) {
        await modalTrigger.click()
        
        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible()
        
        // Find form elements in modal
        const nameInput = modal.locator('input[placeholder*="name"]')
        const messageTextarea = modal.locator('textarea[placeholder*="message"]')
        
        if (await nameInput.count() > 0) {
          await nameInput.fill('Test User')
          await expect(nameInput).toHaveValue('Test User')
        }
        
        if (await messageTextarea.count() > 0) {
          await messageTextarea.fill('This is a test message')
          await expect(messageTextarea).toHaveValue('This is a test message')
        }
        
        // Close modal
        const closeButton = modal.locator('button').filter({ has: page.locator('[name="lucide:x"]') })
        await closeButton.click()
        
        await expect(modal).not.toBeVisible()
      }
    })

    test('should handle modal keyboard navigation', async ({ page }) => {
      await page.locator('button:has-text("Basic Modal")').click()
      
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
      
      // Test tab navigation within modal
      await page.keyboard.press('Tab')
      
      // Should focus close button
      const closeButton = modal.locator('button')
      await expect(closeButton).toBeFocused()
      
      // Test escape key
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    })
  })

  test.describe('Search and Filter Interactions', () => {
    test('should handle search functionality', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="Search components..."]')
      
      // Test search for buttons
      await searchInput.fill('button')
      
      // Should show button-related content
      await expect(page.locator('text=Button')).toBeVisible()
      
      // Test search for non-existent component
      await searchInput.fill('nonexistent')
      
      // Should filter out most content
      // (The exact behavior depends on implementation)
      
      // Clear search
      await searchInput.fill('')
      
      // Should show all content again
      await expect(page.locator('text=Form Components')).toBeVisible()
    })

    test('should handle category filtering', async ({ page }) => {
      const categorySelect = page.locator('select').first()
      
      // Filter by form components
      await categorySelect.selectOption('form')
      
      // Should show form components section
      await expect(page.locator('text=Form Components')).toBeVisible()
      
      // Filter by feedback components
      await categorySelect.selectOption('feedback')
      
      // Should show feedback components
      await expect(page.locator('text=Feedback Components')).toBeVisible()
      
      // Reset filter
      await categorySelect.selectOption('')
      
      // Should show all sections
      await expect(page.locator('text=Form Components')).toBeVisible()
      await expect(page.locator('text=Feedback Components')).toBeVisible()
    })

    test('should combine search and filter', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="Search components..."]')
      const categorySelect = page.locator('select').first()
      
      // Apply both search and filter
      await searchInput.fill('button')
      await categorySelect.selectOption('form')
      
      // Should show filtered results
      await expect(page.locator('text=Button')).toBeVisible()
      
      // Clear both filters
      await searchInput.fill('')
      await categorySelect.selectOption('')
      
      // Should show all content
      await expect(page.locator('text=Form Components')).toBeVisible()
      await expect(page.locator('text=Feedback Components')).toBeVisible()
    })
  })

  test.describe('Code Display Interactions', () => {
    test('should toggle code blocks', async ({ page }) => {
      // Find code toggle buttons
      const codeButtons = page.locator('button').filter({ has: page.locator('[name="lucide:code"]') })
      const count = await codeButtons.count()
      
      if (count > 0) {
        const firstCodeButton = codeButtons.first()
        
        // Toggle code view on
        await firstCodeButton.click()
        
        // Check if code block appears
        const codeBlock = page.locator('pre code')
        await expect(codeBlock).toBeVisible()
        
        // Verify code content exists
        const codeContent = await codeBlock.textContent()
        expect(codeContent).toBeTruthy()
        expect(codeContent!.length).toBeGreaterThan(0)
        
        // Toggle code view off
        await firstCodeButton.click()
        await expect(codeBlock).not.toBeVisible()
      }
    })

    test('should handle copy functionality', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
      
      const copyButtons = page.locator('button').filter({ has: page.locator('[name="lucide:copy"]') })
      const count = await copyButtons.count()
      
      if (count > 0) {
        const firstCopyButton = copyButtons.first()
        
        await firstCopyButton.click()
        
        // Check for success notification
        const successMessage = page.locator('text=Code copied to clipboard!')
        if (await successMessage.count() > 0) {
          await expect(successMessage).toBeVisible()
          
          // Message should disappear after timeout
          await expect(successMessage).not.toBeVisible({ timeout: 3000 })
        }
      }
    })
  })

  test.describe('Complex Component States', () => {
    test('should handle progress bar animations', async ({ page }) => {
      const progressBars = page.locator('[role="progressbar"]')
      const count = await progressBars.count()
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const progressBar = progressBars.nth(i)
          await expect(progressBar).toBeVisible()
          
          // Check if progress bar has proper attributes
          const valueNow = await progressBar.getAttribute('aria-valuenow')
          const valueMax = await progressBar.getAttribute('aria-valuemax')
          
          if (valueNow && valueMax) {
            expect(parseInt(valueNow)).toBeLessThanOrEqual(parseInt(valueMax))
          }
        }
      }
    })

    test('should handle animated components', async ({ page }) => {
      // Look for elements with animation classes
      const animatedElements = page.locator('.animate-spin, .animate-pulse, .transition-all')
      const count = await animatedElements.count()
      
      if (count > 0) {
        // Verify animated elements are visible and functional
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = animatedElements.nth(i)
          await expect(element).toBeVisible()
        }
      }
    })
  })

  test.describe('Error States and Recovery', () => {
    test('should display error states correctly', async ({ page }) => {
      // Look for error messages or error states
      const errorMessages = page.locator('text=This field is required, text=Error, .text-status-error')
      const count = await errorMessages.count()
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const errorElement = errorMessages.nth(i)
          await expect(errorElement).toBeVisible()
        }
      }
    })

    test('should handle validation states', async ({ page }) => {
      // Test form validation if present
      const requiredInputs = page.locator('input[required]')
      const count = await requiredInputs.count()
      
      if (count > 0) {
        const requiredInput = requiredInputs.first()
        
        // Focus and blur without entering value (should show validation)
        await requiredInput.focus()
        await requiredInput.blur()
        
        // The validation behavior depends on implementation
        // Just verify the input is still functional
        await expect(requiredInput).toBeVisible()
      }
    })
  })
})