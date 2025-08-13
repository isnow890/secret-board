// tests/e2e/post-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Post Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('TipTap Editor Integration', () => {
    test('should create a post using TipTap editor', async ({ page }) => {
      // Click on create post link/button
      await page.click('text=글쓰기')
      await expect(page).toHaveURL('/post/create')
      
      // Wait for TipTap editor to load
      await page.waitForSelector('.tiptap-editor-container', { timeout: 10000 })
      await page.waitForSelector('.ProseMirror')

      // Fill in post details
      const title = 'E2E Test Post with TipTap'
      const nickname = '테스터'
      const password = 'test1234'

      await page.fill('input[placeholder*="제목"]', title)
      await page.fill('input[placeholder*="닉네임"]', nickname)
      await page.fill('input[type="password"]', password)

      // Test TipTap editor content creation
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.fill('이것은 TipTap 에디터로 작성한 테스트 게시글입니다.')

      // Test text formatting
      await editor.selectText()
      await page.click('button[title="Bold"]')
      
      // Verify bold formatting applied
      await expect(editor.locator('strong')).toBeVisible()

      // Add more content
      await editor.press('End')
      await editor.press('Enter')
      await editor.type('\n새로운 줄에 추가 내용입니다.')

      // Test heading formatting
      await page.click('button[title="Heading 2"]')
      await editor.type('제목 2입니다')

      // Submit the post
      await page.click('button[type="submit"]:has-text("게시하기")')

      // Verify navigation to the new post
      await expect(page).toHaveURL(/\/post\/[a-f0-9-]+$/)
      
      // Verify post content is displayed correctly
      await expect(page.locator('h1')).toContainText(title)
      await expect(page.locator('.post-content')).toContainText('이것은 TipTap 에디터로 작성한')
      await expect(page.locator('.post-content strong')).toBeVisible()
      await expect(page.locator('.post-content h2')).toContainText('제목 2입니다')
    })

    test('should handle editor validation errors', async ({ page }) => {
      await page.click('text=글쓰기')
      await expect(page).toHaveURL('/post/create')
      
      // Try to submit without required fields
      await page.click('button[type="submit"]:has-text("게시하기")')
      
      // Verify validation errors
      await expect(page.locator('text=제목은 5자 이상이어야 합니다')).toBeVisible()
      await expect(page.locator('text=내용은 10자 이상이어야 합니다')).toBeVisible()
      await expect(page.locator('text=닉네임을 입력해주세요')).toBeVisible()
    })

    test('should handle editor keyboard shortcuts', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.ProseMirror')

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('Bold text test')
      
      // Select all text
      await page.keyboard.press('Control+a')
      
      // Apply bold with keyboard shortcut
      await page.keyboard.press('Control+b')
      
      // Verify bold formatting
      await expect(editor.locator('strong')).toContainText('Bold text test')

      // Test italic shortcut
      await page.keyboard.press('Control+i')
      await expect(editor.locator('strong em')).toContainText('Bold text test')
    })
  })

  test.describe('Image Upload in Editor', () => {
    test('should upload image through editor image button', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.tiptap-editor-container')

      // Fill required fields
      await page.fill('input[placeholder*="제목"]', 'Image Upload Test Post')
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      await page.fill('input[type="password"]', 'test1234')

      // Create a test image file
      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
      
      // Set up file chooser handling
      const fileChooserPromise = page.waitForEvent('filechooser')
      
      // Click image upload button in editor
      await page.click('button[title="Upload Image"]')
      
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer
      }])

      // Wait for upload to complete
      await expect(page.locator('.upload-progress-container')).toBeVisible()
      await page.waitForSelector('.upload-progress-container', { state: 'detached', timeout: 10000 })

      // Verify image appears in editor
      await expect(page.locator('.ProseMirror img')).toBeVisible()

      // Submit post with image
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('이 게시글에는 이미지가 포함되어 있습니다.')

      await page.click('button[type="submit"]:has-text("게시하기")')

      // Verify post created successfully with image
      await expect(page).toHaveURL(/\/post\/[a-f0-9-]+$/)
      await expect(page.locator('.post-content img')).toBeVisible()
    })

    test('should handle image upload errors gracefully', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.tiptap-editor-container')

      // Mock a failed upload by intercepting the request
      await page.route('/api/upload/image', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'File too large'
          })
        })
      })

      // Try to upload an image
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.click('button[title="Upload Image"]')
      
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'large-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(1024 * 1024) // 1MB dummy file
      }])

      // Verify error handling
      await expect(page.locator('.upload-progress-container')).toBeVisible()
      await page.waitForTimeout(2000) // Wait for error processing

      // Error should be handled gracefully (progress item should disappear)
      await expect(page.locator('.upload-progress-container')).not.toBeVisible()
    })

    test('should support drag and drop image upload', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.tiptap-editor-container')

      // Fill required fields
      await page.fill('input[placeholder*="제목"]', 'Drag Drop Test Post')
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      await page.fill('input[type="password"]', 'test1234')

      const editor = page.locator('.ProseMirror')
      
      // Create drag and drop event
      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
      
      // Simulate file drop on editor
      await editor.dispatchEvent('dragover', { dataTransfer: { types: ['Files'] } })
      await editor.dispatchEvent('drop', {
        dataTransfer: {
          files: [{
            name: 'dropped-image.png',
            type: 'image/png',
            size: buffer.length
          }],
          types: ['Files']
        }
      })

      // This test would require mocking the actual file handling in the editor
      // The implementation depends on how TipTap handles file drops
    })
  })

  test.describe('Post Creation Validation', () => {
    test('should validate post title length', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('form')

      // Test title too short
      await page.fill('input[placeholder*="제목"]', '1234') // 4 characters
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      await page.fill('input[type="password"]', 'test1234')
      
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('Valid content for the post')

      await page.click('button[type="submit"]:has-text("게시하기")')
      await expect(page.locator('text=제목은 5자 이상이어야 합니다')).toBeVisible()

      // Test title too long
      const longTitle = 'A'.repeat(256)
      await page.fill('input[placeholder*="제목"]', longTitle)
      await page.click('button[type="submit"]:has-text("게시하기")')
      await expect(page.locator('text=제목은 255자 이하여야 합니다')).toBeVisible()
    })

    test('should validate post content length', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.ProseMirror')

      await page.fill('input[placeholder*="제목"]', 'Valid Title')
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      await page.fill('input[type="password"]', 'test1234')

      // Test content too short
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('123456789') // 9 characters

      await page.click('button[type="submit"]:has-text("게시하기")')
      await expect(page.locator('text=내용은 10자 이상이어야 합니다')).toBeVisible()
    })

    test('should validate nickname format', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('form')

      await page.fill('input[placeholder*="제목"]', 'Valid Title')
      await page.fill('input[type="password"]', 'test1234')
      
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('Valid content for the post')

      // Test special characters in nickname
      await page.fill('input[placeholder*="닉네임"]', '테스터!@#')
      await page.click('button[type="submit"]:has-text("게시하기")')
      await expect(page.locator('text=한글, 영문, 숫자만 허용')).toBeVisible()

      // Test valid nickname
      await page.fill('input[placeholder*="닉네임"]', '테스터123')
      await page.click('button[type="submit"]:has-text("게시하기")')
      
      // Should proceed to success (navigate away from create page)
      await expect(page).not.toHaveURL('/post/create')
    })

    test('should validate password requirements', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('form')

      await page.fill('input[placeholder*="제목"]', 'Valid Title')
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('Valid content for the post')

      // Test password too short
      await page.fill('input[type="password"]', '123') // 3 characters
      await page.click('button[type="submit"]:has-text("게시하기")')
      await expect(page.locator('text=비밀번호는 4자 이상')).toBeVisible()
    })
  })

  test.describe('Editor Toolbar Functionality', () => {
    test('should test all formatting buttons', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.tiptap-toolbar')

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('Formatting test text')

      // Test each formatting button
      await page.keyboard.press('Control+a') // Select all

      // Bold
      await page.click('button[title="Bold"]')
      await expect(editor.locator('strong')).toBeVisible()

      // Italic
      await page.click('button[title="Italic"]')
      await expect(editor.locator('strong em')).toBeVisible()

      // Strikethrough
      await page.click('button[title="Strikethrough"]')
      await expect(editor.locator('s')).toBeVisible()

      // Clear formatting and test headings
      await page.keyboard.press('Control+a')
      await page.keyboard.press('Delete')
      await editor.type('Heading test')
      await page.keyboard.press('Control+a')

      // H1
      await page.click('button[title="Heading 1"]')
      await expect(editor.locator('h1')).toBeVisible()

      // H2
      await page.click('button[title="Heading 2"]')
      await expect(editor.locator('h2')).toBeVisible()

      // H3
      await page.click('button[title="Heading 3"]')
      await expect(editor.locator('h3')).toBeVisible()
    })

    test('should test list formatting', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.tiptap-toolbar')

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('List item 1')

      // Test bullet list
      await page.click('button[title="Bullet List"]')
      await expect(editor.locator('ul li')).toBeVisible()

      await editor.press('Enter')
      await editor.type('List item 2')

      // Convert to ordered list
      await page.click('button[title="Ordered List"]')
      await expect(editor.locator('ol li')).toBeVisible()
    })

    test('should test blockquote formatting', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.tiptap-toolbar')

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('This is a quote')
      await page.keyboard.press('Control+a')

      await page.click('button[title="Blockquote"]')
      await expect(editor.locator('blockquote')).toBeVisible()
      await expect(editor.locator('blockquote')).toContainText('This is a quote')
    })

    test('should test undo/redo functionality', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('.tiptap-toolbar')

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('First text')
      await editor.press('Enter')
      await editor.type('Second text')

      // Test undo
      await page.click('button[title="Undo"]')
      await expect(editor).not.toContainText('Second text')
      await expect(editor).toContainText('First text')

      // Test redo
      await page.click('button[title="Redo"]')
      await expect(editor).toContainText('Second text')
    })
  })

  test.describe('Form Persistence and Navigation', () => {
    test('should warn when leaving with unsaved changes', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('form')

      // Fill form partially
      await page.fill('input[placeholder*="제목"]', 'Unsaved Post')
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('Some content that will be lost')

      // Set up dialog handler
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('beforeunload')
        expect(dialog.message()).toContain('unsaved')
        dialog.dismiss()
      })

      // Try to navigate away
      await page.goto('/')
    })

    test('should not warn after successful submission', async ({ page }) => {
      await page.click('text=글쓰기')
      await page.waitForSelector('form')

      // Fill and submit form
      await page.fill('input[placeholder*="제목"]', 'Complete Post')
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      await page.fill('input[type="password"]', 'test1234')

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.type('This post will be submitted successfully')

      await page.click('button[type="submit"]:has-text("게시하기")')

      // Should navigate to post detail without warning
      await expect(page).toHaveURL(/\/post\/[a-f0-9-]+$/)
    })
  })
})