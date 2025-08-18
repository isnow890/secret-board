// tests/e2e/ai-summary-feature.spec.ts
import { test, expect } from '@playwright/test'

test.describe('AI Summary Feature', () => {
  const testPost = {
    title: 'AI Summary Test Post',
    content: 'This is a long enough post content to trigger AI summary generation. '.repeat(10) + 'AI 요약이 생성될 수 있을 만큼 충분히 긴 게시글 내용입니다.',
    nickname: 'AI테스터',
    password: '1234'
  }

  const shortPost = {
    title: 'Short Post Title',
    content: 'Too short content.', // Under 100 characters
    nickname: 'ShortTester',
    password: '1234'
  }

  test.beforeEach(async ({ page }) => {
    // Mock AI summary API
    await page.route('/api/ai/summarize', async route => {
      const requestBody = await route.request().postDataJSON()
      
      if (requestBody.text && requestBody.text.length >= 100) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              originalText: requestBody.text,
              originalLength: requestBody.text.length,
              summary: '이 게시글은 AI 요약 기능 테스트를 위한 충분한 길이의 내용을 담고 있습니다.',
              summaryLength: 48,
              generatedAt: new Date().toISOString()
            }
          })
        })
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Content too short for summary (minimum 100 characters required)',
            data: {
              textLength: requestBody.text.length,
              minimumLength: 100
            }
          })
        })
      }
    })

    // Mock post creation to return post with AI summary
    await page.route('/api/posts', async route => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON()
        const postId = 'test-ai-post-' + Date.now()
        
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: postId,
              title: requestBody.title,
              created_at: new Date().toISOString()
            }
          })
        })
      }
    })

    // Mock post detail API to include AI summary
    await page.route('/api/posts/*', async route => {
      if (route.request().method() === 'GET') {
        const postId = route.request().url().split('/').pop()
        
        if (postId?.includes('test-ai-post')) {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: postId,
                title: testPost.title,
                content: `<p>${testPost.content}</p>`,
                nickname: testPost.nickname,
                view_count: 1,
                like_count: 0,
                comment_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false,
                ai_summary: '이 게시글은 AI 요약 기능 테스트를 위한 충분한 길이의 내용을 담고 있습니다.',
                summary_generated_at: new Date().toISOString(),
                hasAttachments: false,
                attachmentCount: 0
              }
            })
          })
        } else if (postId?.includes('short-post')) {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: postId,
                title: shortPost.title,
                content: `<p>${shortPost.content}</p>`,
                nickname: shortPost.nickname,
                view_count: 1,
                like_count: 0,
                comment_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false,
                ai_summary: null, // No AI summary for short content
                summary_generated_at: null,
                hasAttachments: false,
                attachmentCount: 0
              }
            })
          })
        }
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('AI Summary Generation for Long Posts', () => {
    test('should generate AI summary after creating long post', async ({ page }) => {
      // Navigate to post creation page
      await page.click('text=글쓰기')
      await expect(page).toHaveURL('/post/create')
      
      // Fill form with long content
      await page.fill('input[placeholder*="제목"]', testPost.title)
      await page.fill('input[placeholder*="닉네임"]', testPost.nickname)
      await page.fill('input[type="password"]', testPost.password)

      // Fill editor with long content
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.fill(testPost.content)

      // Submit the post
      await page.click('button[type="submit"]:has-text("게시하기")')

      // Should navigate to post detail
      await expect(page).toHaveURL(/\/post\/test-ai-post-\d+$/)

      // Wait a moment for AI summary to be generated (in real scenario, this would be async)
      await page.waitForTimeout(2000)
      
      // Reload page to see AI summary (since it's generated in background)
      await page.reload()

      // Check if AI summary card is visible
      await expect(page.locator('.ai-summary-card')).toBeVisible()
      
      // Verify AI summary content
      await expect(page.locator('.ai-summary-card .summary-text')).toContainText('이 게시글은 AI 요약 기능 테스트')
      
      // Verify AI summary header
      await expect(page.locator('.ai-summary-card .header-title')).toContainText('AI 요약')
      
      // Verify sparkles icon
      await expect(page.locator('.ai-summary-card .ai-icon')).toBeVisible()
    })

    test('should display generation time in AI summary card', async ({ page }) => {
      // Navigate directly to a post with AI summary
      await page.goto('/post/test-ai-post-123')
      
      // Check if generation time is displayed
      await expect(page.locator('.ai-summary-card .generation-time')).toBeVisible()
      await expect(page.locator('.ai-summary-card .generation-time')).toContainText('방금 전')
    })

    test('should maintain AI summary card visual design consistency', async ({ page }) => {
      await page.goto('/post/test-ai-post-123')
      
      const summaryCard = page.locator('.ai-summary-card')
      await expect(summaryCard).toBeVisible()
      
      // Check purple-blue gradient background
      const cardStyles = await summaryCard.evaluate(el => getComputedStyle(el))
      expect(cardStyles.backgroundImage).toContain('gradient')
      
      // Check sparkles icon animation
      const sparklesIcon = page.locator('.ai-summary-card .ai-icon')
      await expect(sparklesIcon).toBeVisible()
      
      // Verify hover effects
      await summaryCard.hover()
      await page.waitForTimeout(500) // Wait for animation
      
      // Check background sparkles
      await expect(page.locator('.ai-summary-card .bg-sparkle')).toHaveCount(6)
    })
  })

  test.describe('No AI Summary for Short Posts', () => {
    test('should not generate AI summary for posts under 100 characters', async ({ page }) => {
      // Create a short post
      await page.click('text=글쓰기')
      await page.fill('input[placeholder*="제목"]', shortPost.title)
      await page.fill('input[placeholder*="닉네임"]', shortPost.nickname)
      await page.fill('input[type="password"]', shortPost.password)

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.fill(shortPost.content)

      await page.click('button[type="submit"]:has-text("게시하기")')
      
      // Navigate to short post
      await page.goto('/post/short-post-123')
      
      // AI summary card should not be visible
      await expect(page.locator('.ai-summary-card')).not.toBeVisible()
      
      // Post content should still be visible
      await expect(page.locator('.post-content')).toContainText(shortPost.content)
    })
  })

  test.describe('AI Summary After Post Editing', () => {
    test('should regenerate AI summary when post is edited', async ({ page }) => {
      // Mock post edit API
      await page.route('/api/posts/*/edit', async route => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-edit-post',
              title: 'Edited Post Title',
              content: 'This is edited content that should trigger new AI summary generation.',
              updated_at: new Date().toISOString()
            }
          })
        })
      })

      // Mock password verification for editing
      await page.route('/api/posts/*/verify', async route => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            valid: true
          })
        })
      })

      // Navigate to edit page
      await page.goto('/post/test-ai-post-123/edit')
      
      // Enter password
      await page.fill('input[type="password"]', testPost.password)
      await page.click('button:has-text("확인")')
      
      // Wait for edit form
      await page.waitForSelector('.tiptap-editor-container')
      
      // Edit the content to be longer
      const editor = page.locator('.ProseMirror')
      await editor.click()
      await page.keyboard.press('Control+a')
      await editor.fill('This is extensively edited content that should trigger a new AI summary generation. '.repeat(5))
      
      // Submit edit
      await page.click('button[type="submit"]:has-text("수정하기")')
      
      // Should redirect to post detail
      await expect(page).toHaveURL('/post/test-edit-post')
      
      // Wait for background AI summary regeneration
      await page.waitForTimeout(2000)
      await page.reload()
      
      // New AI summary should be visible
      await expect(page.locator('.ai-summary-card')).toBeVisible()
      await expect(page.locator('.ai-summary-card .summary-text')).toContainText('이 게시글은 AI 요약 기능 테스트')
    })
  })

  test.describe('AI Summary Error Handling', () => {
    test('should handle AI summary generation failure gracefully', async ({ page }) => {
      // Mock AI summary API failure
      await page.route('/api/ai/summarize', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'AI service temporarily unavailable'
          })
        })
      })

      // Create a post
      await page.click('text=글쓰기')
      await page.fill('input[placeholder*="제목"]', testPost.title)
      await page.fill('input[placeholder*="닉네임"]', testPost.nickname)
      await page.fill('input[type="password"]', testPost.password)

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.fill(testPost.content)

      await page.click('button[type="submit"]:has-text("게시하기")')
      
      // Post should be created successfully despite AI summary failure
      await expect(page).toHaveURL(/\/post\/test-ai-post-\d+$/)
      
      // AI summary card should not appear
      await page.waitForTimeout(2000)
      await page.reload()
      await expect(page.locator('.ai-summary-card')).not.toBeVisible()
      
      // Post content should still be visible
      await expect(page.locator('.post-content')).toBeVisible()
    })

    test('should handle slow AI summary generation', async ({ page }) => {
      // Mock slow AI summary API
      await page.route('/api/ai/summarize', async route => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              summary: 'Delayed AI summary generation test.',
              generatedAt: new Date().toISOString()
            }
          })
        })
      })

      await page.click('text=글쓰기')
      await page.fill('input[placeholder*="제목"]', testPost.title)
      await page.fill('input[placeholder*="닉네임"]', testPost.nickname)
      await page.fill('input[type="password"]', testPost.password)

      const editor = page.locator('.ProseMirror')
      await editor.click()
      await editor.fill(testPost.content)

      await page.click('button[type="submit"]:has-text("게시하기")')
      
      // Post should be created immediately
      await expect(page).toHaveURL(/\/post\/test-ai-post-\d+$/)
      
      // Initially no AI summary
      await expect(page.locator('.ai-summary-card')).not.toBeVisible()
      
      // After delay, AI summary should appear
      await page.waitForTimeout(6000)
      await page.reload()
      await expect(page.locator('.ai-summary-card')).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should display AI summary card properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/post/test-ai-post-123')
      
      const summaryCard = page.locator('.ai-summary-card')
      await expect(summaryCard).toBeVisible()
      
      // Check mobile-specific styling
      const cardBox = await summaryCard.boundingBox()
      expect(cardBox?.width).toBeLessThan(400) // Should fit mobile width
      
      // Check text is readable on mobile
      await expect(summaryCard.locator('.summary-text')).toBeVisible()
      await expect(summaryCard.locator('.header-title')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be accessible with screen readers', async ({ page }) => {
      await page.goto('/post/test-ai-post-123')
      
      const summaryCard = page.locator('.ai-summary-card')
      
      // Check semantic structure
      await expect(summaryCard).toBeVisible()
      
      // Verify content is accessible
      await expect(summaryCard.locator('.header-title')).toHaveText('AI 요약')
      await expect(summaryCard.locator('.summary-text')).toBeVisible()
      
      // Check for proper ARIA attributes or semantic HTML
      const headerIcon = summaryCard.locator('.header-icon')
      await expect(headerIcon).toBeVisible()
    })

    test('should work with reduced motion preferences', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      await page.goto('/post/test-ai-post-123')
      
      const summaryCard = page.locator('.ai-summary-card')
      await expect(summaryCard).toBeVisible()
      
      // Animations should be disabled
      const sparkles = page.locator('.ai-summary-card .bg-sparkle')
      
      // Check that animations are not running (CSS animation: none)
      for (const sparkle of await sparkles.all()) {
        const animationStyle = await sparkle.evaluate(el => getComputedStyle(el).animation)
        expect(animationStyle).toBe('none')
      }
    })
  })

  test.describe('Integration with Existing Features', () => {
    test('should position AI summary between content and attachments', async ({ page }) => {
      // Mock post with both AI summary and attachments
      await page.route('/api/posts/test-with-attachments', async route => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-with-attachments',
              title: 'Post with AI Summary and Attachments',
              content: '<p>Post content here</p>',
              nickname: '테스터',
              ai_summary: 'AI generated summary for this post.',
              summary_generated_at: new Date().toISOString(),
              hasAttachments: true,
              attachmentCount: 1,
              attached_files: [{
                filename: 'test-file.pdf',
                url: 'https://example.com/test-file.pdf',
                size: 12345
              }]
            }
          })
        })
      })

      await page.goto('/post/test-with-attachments')
      
      // Check order: content -> AI summary -> attachments
      const postContent = page.locator('.post-content')
      const aiSummary = page.locator('.ai-summary-card')
      const attachments = page.locator('text=첨부파일')
      
      await expect(postContent).toBeVisible()
      await expect(aiSummary).toBeVisible()
      await expect(attachments).toBeVisible()
      
      // Verify positioning order
      const contentBox = await postContent.boundingBox()
      const summaryBox = await aiSummary.boundingBox()
      const attachmentBox = await attachments.boundingBox()
      
      expect(summaryBox?.y).toBeGreaterThan(contentBox?.y || 0)
      expect(attachmentBox?.y).toBeGreaterThan(summaryBox?.y || 0)
    })
  })
})