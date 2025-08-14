// tests/e2e/post-detail-comments.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Post Detail and Comments Flow', () => {
  const testPost = {
    id: 'test-post-id',
    title: 'Test Post for Detail View',
    content: '<p>This is the content of the test post with <strong>bold</strong> text and <em>italic</em> text.</p><h2>Heading</h2><ul><li>List item 1</li><li>List item 2</li></ul>',
    nickname: 'PostAuthor',
    view_count: 42,
    like_count: 15,
    comment_count: 3,
    created_at: new Date('2025-01-15T10:00:00Z').toISOString(),
    is_deleted: false,
    hasAttachments: false,
    attached_files: []
  }

  const testComments = [
    {
      id: 'comment-1',
      post_id: 'test-post-id',
      parent_id: null,
      content: 'This is the first comment',
      nickname: 'Commenter1',
      depth: 0,
      like_count: 2,
      is_author: false,
      is_deleted: false,
      created_at: new Date('2025-01-15T10:30:00Z').toISOString(),
      replies: []
    },
    {
      id: 'comment-2', 
      post_id: 'test-post-id',
      parent_id: null,
      content: 'Second comment with reply',
      nickname: 'Commenter2',
      depth: 0,
      like_count: 1,
      is_author: true, // This is from the post author
      is_deleted: false,
      created_at: new Date('2025-01-15T11:00:00Z').toISOString(),
      replies: [
        {
          id: 'comment-3',
          post_id: 'test-post-id',
          parent_id: 'comment-2',
          content: 'This is a reply to the second comment',
          nickname: 'Replier',
          depth: 1,
          like_count: 0,
          is_author: false,
          is_deleted: false,
          created_at: new Date('2025-01-15T11:30:00Z').toISOString(),
          replies: []
        }
      ]
    }
  ]

  test.beforeEach(async ({ page }) => {
    // Mock post detail API
    await page.route('/api/posts/test-post-id', async route => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: testPost
        })
      })
    })

    // Mock comments API
    await page.route('/api/comments/test-post-id', async route => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            comments: testComments,
            total_count: 3
          }
        })
      })
    })

    // Mock like toggle API
    await page.route('/api/posts/test-post-id/like', async route => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            like_count: testPost.like_count + 1,
            is_liked: true
          }
        })
      })
    })

    await page.goto('/post/test-post-id')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Post Content Display', () => {
    test('should display post content correctly', async ({ page }) => {
      // Verify post title
      await expect(page.locator('h1')).toContainText('Test Post for Detail View')
      
      // Verify post metadata
      await expect(page.locator('text=PostAuthor')).toBeVisible()
      await expect(page.locator('text=조회 42')).toBeVisible()
      await expect(page.locator('text=좋아요 15')).toBeVisible()
      await expect(page.locator('text=댓글 3')).toBeVisible()

      // Verify formatted content is displayed correctly
      const postContent = page.locator('.post-content')
      await expect(postContent.locator('strong')).toContainText('bold')
      await expect(postContent.locator('em')).toContainText('italic')
      await expect(postContent.locator('h2')).toContainText('Heading')
      await expect(postContent.locator('ul li')).toHaveCount(2)
      await expect(postContent.locator('ul li').first()).toContainText('List item 1')
    })

    test('should increment view count on page load', async ({ page }) => {
      // Mock incremented view count
      await page.route('/api/posts/test-post-id', async route => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...testPost, view_count: 43 }
          })
        })
      })

      await page.reload()
      await expect(page.locator('text=조회 43')).toBeVisible()
    })

    test('should handle post like functionality', async ({ page }) => {
      // Click like button
      await page.click('button:has-text("좋아요")')
      
      // Should show updated like count
      await expect(page.locator('text=좋아요 16')).toBeVisible()
      
      // Like button should indicate liked state
      await expect(page.locator('button:has-text("좋아요")').first()).toHaveClass(/liked/)
    })

    test('should show post actions for author', async ({ page }) => {
      // This test would verify edit/delete buttons are shown for post author
      // Implementation depends on how author verification is handled
      
      // Mock post with author verification
      await page.route('/api/posts/test-post-id', async route => {
        await route.fulfill({
          contentType: 'application/json', 
          body: JSON.stringify({
            success: true,
            data: { ...testPost, is_author: true }
          })
        })
      })

      await page.reload()
      
      // Should show edit and delete buttons
      await expect(page.locator('button:has-text("수정")')).toBeVisible()
      await expect(page.locator('button:has-text("삭제")')).toBeVisible()
    })
  })

  test.describe('Comments Display', () => {
    test('should display comments correctly', async ({ page }) => {
      // Verify comment count header
      await expect(page.locator('text=댓글 3개')).toBeVisible()
      
      // Verify first comment
      const firstComment = page.locator('[data-comment-id="comment-1"]')
      await expect(firstComment.locator('text=Commenter1')).toBeVisible()
      await expect(firstComment.locator('text=This is the first comment')).toBeVisible()
      await expect(firstComment.locator('text=좋아요 2')).toBeVisible()

      // Verify second comment (author comment)
      const secondComment = page.locator('[data-comment-id="comment-2"]')
      await expect(secondComment.locator('text=Commenter2')).toBeVisible()
      await expect(secondComment.locator('text=Second comment with reply')).toBeVisible()
      await expect(secondComment.locator('.author-badge')).toBeVisible() // Author indicator

      // Verify reply
      const replyComment = page.locator('[data-comment-id="comment-3"]')
      await expect(replyComment.locator('text=Replier')).toBeVisible()
      await expect(replyComment.locator('text=This is a reply')).toBeVisible()
      await expect(replyComment).toHaveClass(/reply/) // Indented styling
    })

    test('should handle comment hierarchical structure', async ({ page }) => {
      // Verify parent-child relationship styling
      const parentComment = page.locator('[data-comment-id="comment-2"]')
      const childComment = page.locator('[data-comment-id="comment-3"]')
      
      // Child comment should be visually indented
      const parentRect = await parentComment.boundingBox()
      const childRect = await childComment.boundingBox()
      
      expect(childRect?.x).toBeGreaterThan(parentRect?.x || 0)
    })

    test('should show relative timestamps', async ({ page }) => {
      // Comments should show relative time (e.g., "1시간 전")
      await expect(page.locator('text=시간 전')).toBeVisible()
      await expect(page.locator('text=분 전')).toBeVisible()
    })
  })

  test.describe('Comment Creation', () => {
    test('should create new top-level comment', async ({ page }) => {
      // Mock comment creation API
      await page.route('/api/comments', async route => {
        const requestBody = await route.request().postDataJSON()
        const newComment = {
          id: 'new-comment-id',
          post_id: 'test-post-id',
          parent_id: null,
          content: requestBody.content,
          nickname: requestBody.nickname,
          depth: 0,
          like_count: 0,
          is_author: requestBody.isAuthor || false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          replies: []
        }

        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: newComment
          })
        })
      })

      // Fill comment form
      await page.fill('textarea[placeholder*="댓글"]', '새로운 댓글입니다.')
      await page.fill('input[placeholder*="닉네임"]', '새댓글작성자')
      await page.fill('input[type="password"]', 'comment123')
      
      // Submit comment
      await page.click('button:has-text("댓글 작성")')
      
      // Should show success message or new comment
      await expect(page.locator('text=새로운 댓글입니다.')).toBeVisible()
      await expect(page.locator('text=새댓글작성자')).toBeVisible()
    })

    test('should create reply to existing comment', async ({ page }) => {
      // Mock reply creation API  
      await page.route('/api/comments', async route => {
        const requestBody = await route.request().postDataJSON()
        const newReply = {
          id: 'new-reply-id',
          post_id: 'test-post-id',
          parent_id: requestBody.parentId,
          content: requestBody.content,
          nickname: requestBody.nickname,
          depth: 1,
          like_count: 0,
          is_author: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          replies: []
        }

        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: newReply
          })
        })
      })

      // Click reply button on first comment
      const firstComment = page.locator('[data-comment-id="comment-1"]')
      await firstComment.locator('button:has-text("답글")').click()
      
      // Reply form should appear
      const replyForm = page.locator('.reply-form')
      await expect(replyForm).toBeVisible()
      
      // Fill reply form
      await replyForm.locator('textarea').fill('이것은 답글입니다.')
      await replyForm.locator('input[placeholder*="닉네임"]').fill('답글작성자')
      await replyForm.locator('input[type="password"]').fill('reply123')
      
      // Submit reply
      await replyForm.locator('button:has-text("답글 작성")').click()
      
      // Should show new reply
      await expect(page.locator('text=이것은 답글입니다.')).toBeVisible()
      await expect(page.locator('text=답글작성자')).toBeVisible()
    })

    test('should validate comment form', async ({ page }) => {
      // Try to submit empty comment
      await page.click('button:has-text("댓글 작성")')
      
      // Should show validation errors
      await expect(page.locator('text=댓글 내용을 입력해주세요')).toBeVisible()
      await expect(page.locator('text=닉네임을 입력해주세요')).toBeVisible()
      await expect(page.locator('text=비밀번호를 입력해주세요')).toBeVisible()
    })

    test('should validate comment length', async ({ page }) => {
      // Test too long comment
      const longComment = 'A'.repeat(1001)
      await page.fill('textarea[placeholder*="댓글"]', longComment)
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      await page.fill('input[type="password"]', 'test123')
      
      await page.click('button:has-text("댓글 작성")')
      
      // Should show length validation error
      await expect(page.locator('text=1000자 이하')).toBeVisible()
    })

    test('should handle comment submission errors', async ({ page }) => {
      // Mock API error
      await page.route('/api/comments', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server error'
          })
        })
      })

      // Fill and submit comment
      await page.fill('textarea[placeholder*="댓글"]', '댓글 내용')
      await page.fill('input[placeholder*="닉네임"]', '테스터')
      await page.fill('input[type="password"]', 'test123')
      
      await page.click('button:has-text("댓글 작성")')
      
      // Should show error message
      await expect(page.locator('text=댓글 작성에 실패했습니다')).toBeVisible()
    })
  })

  test.describe('Comment Interactions', () => {
    test('should like/unlike comments', async ({ page }) => {
      // Mock comment like API
      await page.route('/api/comments/comment-1/like', async route => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              like_count: 3,
              is_liked: true
            }
          })
        })
      })

      // Click like on first comment
      const firstComment = page.locator('[data-comment-id="comment-1"]')
      await firstComment.locator('button:has-text("좋아요")').click()
      
      // Should show updated like count
      await expect(firstComment.locator('text=좋아요 3')).toBeVisible()
    })

    test('should show comment depth limits', async ({ page }) => {
      // Mock deeply nested comments (test depth limit of 10)
      const deepComments: any[] = []
      let currentParentId = 'comment-1'
      
      for (let i = 0; i < 12; i++) {
        deepComments.push({
          id: `deep-comment-${i}`,
          post_id: 'test-post-id',
          parent_id: currentParentId,
          content: `Deep comment level ${i + 1}`,
          nickname: `DeepCommenter${i}`,
          depth: Math.min(i + 1, 10), // Max depth 10
          like_count: 0,
          is_author: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          replies: []
        })
        currentParentId = `deep-comment-${i}`
      }

      await page.route('/api/comments/test-post-id', async route => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              comments: deepComments,
              total_count: deepComments.length
            }
          })
        })
      })

      await page.reload()

      // Should show maximum indentation at depth 10
      const maxDepthComment = page.locator('[data-comment-id="deep-comment-9"]')
      const overMaxDepthComment = page.locator('[data-comment-id="deep-comment-10"]')
      
      await expect(maxDepthComment).toBeVisible()
      await expect(overMaxDepthComment).toBeVisible()
      
      // Both should have same indentation (max depth styling)
      const maxDepthRect = await maxDepthComment.boundingBox()
      const overMaxDepthRect = await overMaxDepthComment.boundingBox()
      
      expect(Math.abs((maxDepthRect?.x || 0) - (overMaxDepthRect?.x || 0))).toBeLessThan(5)
    })
  })

  test.describe('Comment Management', () => {
    test('should edit own comment with password verification', async ({ page }) => {
      // Mock comment edit/verification APIs
      await page.route('/api/comments/comment-1/verify', async route => {
        const requestBody = await route.request().postDataJSON()
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            valid: requestBody.password === 'correct123'
          })
        })
      })

      await page.route('/api/comments/comment-1', async route => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ...testComments[0],
                content: 'Edited comment content'
              }
            })
          })
        }
      })

      // Click edit button on comment
      const firstComment = page.locator('[data-comment-id="comment-1"]')
      await firstComment.locator('button:has-text("수정")').click()
      
      // Password verification dialog should appear
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      
      // Enter correct password
      await page.fill('input[type="password"]', 'correct123')
      await page.click('button:has-text("확인")')
      
      // Edit form should appear
      await expect(page.locator('textarea[value*="This is the first comment"]')).toBeVisible()
      
      // Edit the comment
      await page.fill('textarea', 'Edited comment content')
      await page.click('button:has-text("수정 완료")')
      
      // Should show updated content
      await expect(page.locator('text=Edited comment content')).toBeVisible()
    })

    test('should delete comment with password verification', async ({ page }) => {
      // Mock comment delete APIs
      await page.route('/api/comments/comment-1/verify', async route => {
        const requestBody = await route.request().postDataJSON()
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            valid: requestBody.password === 'correct123'
          })
        })
      })

      await page.route('/api/comments/comment-1', async route => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: '댓글이 삭제되었습니다.'
            })
          })
        }
      })

      // Click delete button on comment
      const firstComment = page.locator('[data-comment-id="comment-1"]')
      await firstComment.locator('button:has-text("삭제")').click()
      
      // Confirmation dialog should appear
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('정말 삭제하시겠습니까')
        await dialog.accept()
      })
      
      // Password verification dialog should appear
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await page.fill('input[type="password"]', 'correct123')
      await page.click('button:has-text("확인")')
      
      // Comment should be removed or marked as deleted
      await expect(page.locator('text=삭제된 댓글입니다')).toBeVisible()
    })
  })

  test.describe('Real-time Features', () => {
    test('should update comment count after new comment', async ({ page }) => {
      // Initial comment count
      await expect(page.locator('text=댓글 3개')).toBeVisible()
      
      // Mock successful comment creation
      await page.route('/api/comments', async route => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-comment-id',
              content: '새 댓글',
              nickname: '작성자'
            }
          })
        })
      })

      // Add new comment
      await page.fill('textarea[placeholder*="댓글"]', '새 댓글')
      await page.fill('input[placeholder*="닉네임"]', '작성자')
      await page.fill('input[type="password"]', 'test123')
      await page.click('button:has-text("댓글 작성")')
      
      // Comment count should update
      await expect(page.locator('text=댓글 4개')).toBeVisible()
    })
  })
})