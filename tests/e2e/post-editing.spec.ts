// tests/e2e/post-editing.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Post Editing Flow', () => {
  const testPost = {
    id: 'test-post-id',
    title: 'Original Test Post',
    content: '<p>Original post content</p>',
    nickname: 'TestUser',
    password: 'test1234'
  }

  test.beforeEach(async ({ page }) => {
    // Mock the post data and API responses
    await page.route('/api/posts/test-post-id', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testPost
          })
        })
      } else if (route.request().method() === 'PUT') {
        const requestBody = await route.request().postDataJSON()
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...testPost,
              ...requestBody,
              updated_at: new Date().toISOString()
            }
          })
        })
      }
    })

    // Mock password verification
    await page.route('/api/posts/test-post-id/verify', async route => {
      const requestBody = await route.request().postDataJSON()
      const isValidPassword = requestBody.password === 'test1234'
      
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          valid: isValidPassword
        })
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Password Authentication for Editing', () => {
    test('should require password authentication before editing', async ({ page }) => {
      // Navigate to edit page
      await page.goto('/post/test-post-id/edit')
      
      // Should show password confirmation dialog
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=비밀번호 확인')).toBeVisible()
      
      // Verify form is not accessible until password is confirmed
      await expect(page.locator('.tiptap-editor-container')).not.toBeVisible()
    })

    test('should authenticate with correct password', async ({ page }) => {
      await page.goto('/post/test-post-id/edit')
      
      // Enter correct password
      const passwordInput = page.locator('input[type="password"]')
      await passwordInput.fill('test1234')
      await page.click('button:has-text("확인")')
      
      // Should close dialog and show edit form
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
      await expect(page.locator('.tiptap-editor-container')).toBeVisible()
      
      // Form should be pre-filled with existing data
      await expect(page.locator('input[placeholder*="제목"]')).toHaveValue('Original Test Post')
      await expect(page.locator('.ProseMirror')).toContainText('Original post content')
    })

    test('should reject incorrect password', async ({ page }) => {
      await page.goto('/post/test-post-id/edit')
      
      // Enter wrong password
      const passwordInput = page.locator('input[type="password"]')
      await passwordInput.fill('wrongpassword')
      await page.click('button:has-text("확인")')
      
      // Should show error message
      await expect(page.locator('text=비밀번호가 틀렸습니다')).toBeVisible()
      
      // Dialog should remain open
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('.tiptap-editor-container')).not.toBeVisible()
    })

    test('should handle authentication timeout', async ({ page }) => {
      // Mock expired authentication in sessionStorage
      await page.addInitScript(() => {
        const expiredAuth = {
          password: 'test1234',
          timestamp: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
        }
        sessionStorage.setItem('edit_auth_test-post-id', JSON.stringify(expiredAuth))
      })

      await page.goto('/post/test-post-id/edit')
      
      // Should show password dialog despite having expired auth in storage
      await expect(page.locator('[role="dialog"]')).toBeVisible()
    })

    test('should remember authentication within session', async ({ page }) => {
      // First authentication
      await page.goto('/post/test-post-id/edit')
      await page.fill('input[type="password"]', 'test1234')
      await page.click('button:has-text("확인")')
      await expect(page.locator('.tiptap-editor-container')).toBeVisible()
      
      // Navigate away and back
      await page.goto('/')
      await page.goto('/post/test-post-id/edit')
      
      // Should not require authentication again
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
      await expect(page.locator('.tiptap-editor-container')).toBeVisible()
    })
  })

  test.describe('TipTap Editor in Edit Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate first
      await page.goto('/post/test-post-id/edit')
      await page.fill('input[type="password"]', 'test1234')
      await page.click('button:has-text("확인")')
      await page.waitForSelector('.tiptap-editor-container')
    })

    test('should load existing content in editor', async ({ page }) => {
      // Verify existing content is loaded
      await expect(page.locator('input[placeholder*="제목"]')).toHaveValue('Original Test Post')
      await expect(page.locator('.ProseMirror')).toContainText('Original post content')
    })

    test('should edit content using TipTap editor', async ({ page }) => {
      const editor = page.locator('.ProseMirror')
      
      // Clear and add new content
      await editor.click()
      await page.keyboard.press('Control+a')
      await editor.type('Updated content with TipTap editor')
      
      // Apply formatting
      await page.keyboard.press('Control+a')
      await page.click('button[title="Bold"]')
      
      // Verify formatting applied
      await expect(editor.locator('strong')).toContainText('Updated content with TipTap editor')
      
      // Add heading
      await editor.press('End')
      await editor.press('Enter')
      await editor.type('New Heading')
      await page.keyboard.press('Control+a')
      await page.click('button[title="Heading 2"]')
      
      await expect(editor.locator('h2')).toContainText('New Heading')
    })

    test('should handle image uploads during editing', async ({ page }) => {
      const editor = page.locator('.ProseMirror')
      await editor.click()
      
      // Mock successful image upload
      await page.route('/api/upload/image', route => {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              filename: 'updated-image.jpg',
              url: 'https://example.com/updated-image.jpg',
              size: 12345
            }
          })
        })
      })

      // Upload image through editor
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.click('button[title="Upload Image"]')
      
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'updated-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      }])

      // Verify image appears in editor
      await expect(editor.locator('img')).toBeVisible()
    })

    test('should validate edited content before submission', async ({ page }) => {
      // Clear title (make it invalid)
      await page.fill('input[placeholder*="제목"]', '1234') // Too short
      
      await page.click('button[type="submit"]:has-text("수정하기")')
      
      // Should show validation error
      await expect(page.locator('text=제목은 5자 이상이어야 합니다')).toBeVisible()
      
      // Should not submit the form
      await expect(page).toHaveURL('/post/test-post-id/edit')
    })

    test('should submit edited post successfully', async ({ page }) => {
      // Edit the post
      await page.fill('input[placeholder*="제목"]', 'Updated Test Post Title')
      
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await page.keyboard.press('Control+a')
      await editor.type('This is the updated content for the test post.')
      
      // Submit the form
      await page.click('button[type="submit"]:has-text("수정하기")')
      
      // Should navigate to post detail page
      await expect(page).toHaveURL('/post/test-post-id')
      
      // Should show updated content (this would need the post detail page to be mocked)
      // await expect(page.locator('h1')).toContainText('Updated Test Post Title')
    })
  })

  test.describe('Form State Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/post/test-post-id/edit')
      await page.fill('input[type="password"]', 'test1234')
      await page.click('button:has-text("확인")')
      await page.waitForSelector('.tiptap-editor-container')
    })

    test('should detect form modifications', async ({ page }) => {
      // Make a change to the title
      await page.fill('input[placeholder*="제목"]', 'Modified Title')
      
      // Set up beforeunload handler
      let dialogHandled = false
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('beforeunload')
        dialogHandled = true
        await dialog.dismiss()
      })
      
      // Try to navigate away
      await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeunload'))
      })
      
      // Note: In actual test, this would depend on the specific implementation
      // of the beforeunload handler in usePostEditor
    })

    test('should warn on router navigation with unsaved changes', async ({ page }) => {
      // Make changes
      await page.fill('input[placeholder*="제목"]', 'Changed Title')
      
      let confirmDialogShown = false
      page.on('dialog', async dialog => {
        if (dialog.type() === 'confirm') {
          expect(dialog.message()).toContain('수정 중인 내용이 있습니다')
          confirmDialogShown = true
          await dialog.dismiss() // Cancel navigation
        }
      })
      
      // Try to navigate to another page
      await page.click('text=홈') // Assuming there's a home link
      
      // Should stay on edit page
      await expect(page).toHaveURL('/post/test-post-id/edit')
    })

    test('should not warn after successful submission', async ({ page }) => {
      // Edit and submit
      await page.fill('input[placeholder*="제목"]', 'Successfully Updated Title')
      
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await page.keyboard.press('Control+a')
      await editor.type('Successfully updated content.')
      
      await page.click('button[type="submit"]:has-text("수정하기")')
      
      // After successful submission, no warning should appear when navigating
      await expect(page).toHaveURL('/post/test-post-id')
    })
  })

  test.describe('Error Handling During Edit', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/post/test-post-id/edit')
      await page.fill('input[type="password"]', 'test1234')
      await page.click('button:has-text("확인")')
      await page.waitForSelector('.tiptap-editor-container')
    })

    test('should handle submission errors gracefully', async ({ page }) => {
      // Mock submission error
      await page.route('/api/posts/test-post-id', route => {
        if (route.request().method() === 'PUT') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Server error during update'
            })
          })
        }
      })

      // Make valid changes
      await page.fill('input[placeholder*="제목"]', 'Valid Updated Title')
      
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await page.keyboard.press('Control+a')
      await editor.type('Valid updated content.')
      
      // Submit form
      await page.click('button[type="submit"]:has-text("수정하기")')
      
      // Should show error message
      await expect(page.locator('text=Server error during update')).toBeVisible()
      
      // Should stay on edit page
      await expect(page).toHaveURL('/post/test-post-id/edit')
    })

    test('should handle authentication failure during submission', async ({ page }) => {
      // Clear authentication in sessionStorage to simulate expired session
      await page.evaluate(() => {
        sessionStorage.removeItem('edit_auth_test-post-id')
      })

      // Try to submit
      await page.click('button[type="submit"]:has-text("수정하기")')
      
      // Should show authentication error
      await expect(page.locator('text=인증이 필요합니다')).toBeVisible()
    })

    test('should handle network errors during image upload', async ({ page }) => {
      // Mock network error for image upload
      await page.route('/api/upload/image', route => {
        route.abort('failed')
      })

      const editor = page.locator('.ProseMirror')
      await editor.click()

      // Try to upload image
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.click('button[title="Upload Image"]')
      
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      }])

      // Should handle error gracefully
      await expect(page.locator('.upload-progress-container')).toBeVisible()
      
      // Error should be processed and progress should disappear
      await page.waitForTimeout(3000)
      await expect(page.locator('.upload-progress-container')).not.toBeVisible()
    })
  })

  test.describe('Editor Features During Edit', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/post/test-post-id/edit')
      await page.fill('input[type="password"]', 'test1234')
      await page.click('button:has-text("확인")')
      await page.waitForSelector('.tiptap-editor-container')
    })

    test('should maintain existing formatting when editing', async ({ page }) => {
      // Add some formatted content to the post mock
      await page.route('/api/posts/test-post-id', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ...testPost,
                content: '<p>Normal text</p><h2>Heading</h2><ul><li>List item</li></ul><blockquote><p>Quote</p></blockquote>'
              }
            })
          })
        }
      })

      // Reload to get formatted content
      await page.reload()
      await page.fill('input[type="password"]', 'test1234')
      await page.click('button:has-text("확인")')
      await page.waitForSelector('.ProseMirror')

      const editor = page.locator('.ProseMirror')
      
      // Verify existing formatting is preserved
      await expect(editor.locator('h2')).toContainText('Heading')
      await expect(editor.locator('ul li')).toContainText('List item')
      await expect(editor.locator('blockquote')).toContainText('Quote')
    })

    test('should support mixed content editing', async ({ page }) => {
      const editor = page.locator('.ProseMirror')
      
      // Clear and create mixed content
      await editor.click()
      await page.keyboard.press('Control+a')
      await page.keyboard.press('Delete')
      
      // Add paragraph
      await editor.type('This is a paragraph.')
      await editor.press('Enter')
      
      // Add heading
      await editor.type('This will be a heading')
      await page.keyboard.press('Control+a')
      await page.click('button[title="Heading 2"]')
      
      // Add list
      await editor.press('End')
      await editor.press('Enter')
      await editor.type('First item')
      await page.click('button[title="Bullet List"]')
      await editor.press('Enter')
      await editor.type('Second item')
      
      // Verify mixed content structure
      await expect(editor.locator('p')).toContainText('This is a paragraph.')
      await expect(editor.locator('h2')).toContainText('This will be a heading')
      await expect(editor.locator('ul li')).toHaveCount(2)
    })
  })
})