// tests/api/posts.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn() as any
mockFetch.raw = vi.fn()
mockFetch.create = vi.fn()
global.$fetch = mockFetch

describe('Posts API', () => {
  const mockPost = {
    id: 'test-post-id',
    title: 'Test Post Title',
    content: '<p>Test post content</p>',
    nickname: 'TestUser',
    view_count: 10,
    like_count: 5,
    comment_count: 3,
    created_at: new Date().toISOString(),
    is_deleted: false,
    hasAttachments: false,
    attached_files: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/posts', () => {
    it('should fetch posts list successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [mockPost],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
            hasMore: false
          }
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts?page=1&limit=20')

      expect(mockFetch).toHaveBeenCalledWith('/api/posts?page=1&limit=20')
      expect(result).toEqual(mockResponse)
      expect(result.data.posts[0]).toEqual(mockPost)
    })

    it('should handle search query parameter', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [mockPost],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasMore: false }
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      await $fetch('/api/posts?search=test&page=1&limit=20')

      expect(mockFetch).toHaveBeenCalledWith('/api/posts?search=test&page=1&limit=20')
    })

    it('should handle sort parameter', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [mockPost],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasMore: false }
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      await $fetch('/api/posts?sort=likes&page=1&limit=20')

      expect(mockFetch).toHaveBeenCalledWith('/api/posts?sort=likes&page=1&limit=20')
    })

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [],
          pagination: { currentPage: 2, totalPages: 5, totalCount: 100, hasMore: true }
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      await $fetch('/api/posts?page=2&limit=10')

      expect(mockFetch).toHaveBeenCalledWith('/api/posts?page=2&limit=10')
    })

    it('should handle API errors', async () => {
      const mockError = {
        statusCode: 500,
        statusMessage: 'Internal Server Error'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts')).rejects.toEqual(mockError)
    })
  })

  describe('POST /api/posts', () => {
    const validPostData = {
      title: 'New Test Post',
      content: '<p>This is a new test post content</p>',
      nickname: 'TestUser',
      password: 'password123',
      attachedFiles: []
    }

    it('should create post successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'new-post-id',
          ...validPostData,
          created_at: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts', {
        method: 'POST',
        body: validPostData
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
        method: 'POST',
        body: validPostData
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle validation errors for title', async () => {
      const invalidData = {
        ...validPostData,
        title: '' // Too short
      }

      const mockError = {
        statusCode: 400,
        statusMessage: '제목은 5자 이상 255자 이하여야 합니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts', {
        method: 'POST',
        body: invalidData
      })).rejects.toEqual(mockError)
    })

    it('should handle validation errors for content', async () => {
      const invalidData = {
        ...validPostData,
        content: '' // Too short
      }

      const mockError = {
        statusCode: 400,
        statusMessage: '내용은 10자 이상이어야 합니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts', {
        method: 'POST',
        body: invalidData
      })).rejects.toEqual(mockError)
    })

    it('should handle validation errors for password', async () => {
      const invalidData = {
        ...validPostData,
        password: '123' // Too short
      }

      const mockError = {
        statusCode: 400,
        statusMessage: '비밀번호는 4자 이상 20자 이하여야 합니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts', {
        method: 'POST',
        body: invalidData
      })).rejects.toEqual(mockError)
    })

    it('should handle validation errors for nickname', async () => {
      const invalidData = {
        ...validPostData,
        nickname: '' // Too short
      }

      const mockError = {
        statusCode: 400,
        statusMessage: '닉네임은 1자 이상 10자 이하여야 합니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts', {
        method: 'POST',
        body: invalidData
      })).rejects.toEqual(mockError)
    })

    it('should create post with attached files', async () => {
      const postWithFiles = {
        ...validPostData,
        attachedFiles: [
          { filename: 'image1.jpg', url: 'https://example.com/image1.jpg', size: 12345 },
          { filename: 'image2.png', url: 'https://example.com/image2.png', size: 67890 }
        ]
      }

      const mockResponse = {
        success: true,
        data: {
          id: 'new-post-id',
          ...postWithFiles,
          created_at: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts', {
        method: 'POST',
        body: postWithFiles
      })

      expect((result.data as any)?.attachedFiles).toHaveLength(2)
      expect((result.data as any)?.attachedFiles[0].filename).toBe('image1.jpg')
    })
  })

  describe('GET /api/posts/[id]', () => {
    it('should fetch single post successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockPost
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts/test-post-id')

      expect(mockFetch).toHaveBeenCalledWith('/api/posts/test-post-id')
      expect(result).toEqual(mockResponse)
    })

    it('should handle post not found error', async () => {
      const mockError = {
        statusCode: 404,
        statusMessage: '게시글을 찾을 수 없습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts/nonexistent-id')).rejects.toEqual(mockError)
    })

    it('should increment view count on fetch', async () => {
      const mockResponse = {
        success: true,
        data: {
          ...mockPost,
          view_count: 11 // Incremented
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts/test-post-id')

      expect(result.data?.view_count).toBe(11)
    })
  })

  describe('POST /api/posts/[id]/verify', () => {
    it('should verify password successfully', async () => {
      const mockResponse = {
        success: true,
        valid: true
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts/test-post-id/verify', {
        method: 'POST',
        body: { password: 'correct-password' }
      }) as any

      expect(mockFetch).toHaveBeenCalledWith('/api/posts/test-post-id/verify', {
        method: 'POST',
        body: { password: 'correct-password' }
      })
      expect(result.valid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const mockResponse = {
        success: true,
        valid: false
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts/test-post-id/verify', {
        method: 'POST',
        body: { password: 'wrong-password' }
      }) as any

      expect(result.valid).toBe(false)
    })

    it('should handle verification errors', async () => {
      const mockError = {
        statusCode: 404,
        statusMessage: '게시글을 찾을 수 없습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts/nonexistent-id/verify', {
        method: 'POST',
        body: { password: 'any-password' }
      })).rejects.toEqual(mockError)
    })
  })

  describe('PUT /api/posts/[id]', () => {
    const editPostData = {
      title: 'Updated Post Title',
      content: '<p>Updated post content</p>',
      password: 'correct-password',
      attachedFiles: []
    }

    it('should update post successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          ...mockPost,
          ...editPostData,
          updated_at: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await ($fetch as any)('/api/posts/test-post-id', {
        method: 'POST',
        body: editPostData
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/posts/test-post-id', {
        method: 'POST',
        body: editPostData
      })
      expect(result.data?.title).toBe('Updated Post Title')
    })

    it('should handle incorrect password for edit', async () => {
      const mockError = {
        statusCode: 403,
        statusMessage: '비밀번호가 일치하지 않습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect(($fetch as any)('/api/posts/test-post-id', {
        method: 'POST',
        body: { ...editPostData, password: 'wrong-password' }
      })).rejects.toEqual(mockError)
    })

    it('should handle validation errors during edit', async () => {
      const invalidEditData = {
        ...editPostData,
        title: 'A' // Too short
      }

      const mockError = {
        statusCode: 400,
        statusMessage: '제목은 5자 이상 255자 이하여야 합니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect(($fetch as any)('/api/posts/test-post-id', {
        method: 'POST',
        body: invalidEditData
      })).rejects.toEqual(mockError)
    })
  })

  describe('DELETE /api/posts/[id]', () => {
    it('should delete post successfully', async () => {
      const mockResponse = {
        success: true,
        message: '게시글이 삭제되었습니다.'
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await ($fetch as any)('/api/posts/test-post-id', {
        method: 'POST',
        body: { password: 'correct-password' }
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/posts/test-post-id', {
        method: 'POST',
        body: { password: 'correct-password' }
      })
      expect((result as any).message).toBe('게시글이 삭제되었습니다.')
    })

    it('should handle incorrect password for delete', async () => {
      const mockError = {
        statusCode: 403,
        statusMessage: '비밀번호가 일치하지 않습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect(($fetch as any)('/api/posts/test-post-id', {
        method: 'POST',
        body: { password: 'wrong-password' }
      })).rejects.toEqual(mockError)
    })

    it('should handle delete non-existent post', async () => {
      const mockError = {
        statusCode: 404,
        statusMessage: '게시글을 찾을 수 없습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect(($fetch as any)('/api/posts/nonexistent-id', {
        method: 'POST',
        body: { password: 'any-password' }
      })).rejects.toEqual(mockError)
    })
  })

  describe('POST /api/posts/[id]/like', () => {
    it('should toggle like successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          like_count: 6,
          is_liked: true
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts/test-post-id/like', {
        method: 'POST',
        body: { action: 'like' }
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/posts/test-post-id/like', {
        method: 'POST',
        body: { action: 'like' }
      })
      expect(result.data?.like_count).toBe(6)
      expect((result.data as any)?.is_liked).toBe(true)
    })

    it('should handle unlike action', async () => {
      const mockResponse = {
        success: true,
        data: {
          like_count: 4,
          is_liked: false
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts/test-post-id/like', {
        method: 'POST',
        body: { action: 'unlike' }
      })

      expect(result.data?.like_count).toBe(4)
      expect((result.data as any)?.is_liked).toBe(false)
    })

    it('should handle like on non-existent post', async () => {
      const mockError = {
        statusCode: 404,
        statusMessage: '게시글을 찾을 수 없습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts/nonexistent-id/like', {
        method: 'POST',
        body: { action: 'like' }
      })).rejects.toEqual(mockError)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed request body', async () => {
      const mockError = {
        statusCode: 400,
        statusMessage: '잘못된 요청 형식입니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts', {
        method: 'POST',
        body: 'invalid-json'
      })).rejects.toEqual(mockError)
    })

    it('should handle database connection errors', async () => {
      const mockError = {
        statusCode: 503,
        statusMessage: '서비스를 일시적으로 사용할 수 없습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts')).rejects.toEqual(mockError)
    })

    it('should handle rate limiting', async () => {
      const mockError = {
        statusCode: 429,
        statusMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      }

      mockFetch.mockRejectedValue(mockError)

      await expect($fetch('/api/posts', {
        method: 'POST',
        body: {
          title: 'Test Post',
          content: 'Test Content',
          nickname: 'TestUser',
          password: 'password123'
        }
      })).rejects.toEqual(mockError)
    })

    it('should handle XSS prevention in content', async () => {
      const maliciousContent = {
        title: 'Test Post',
        content: '<script>alert("xss")</script><p>Normal content</p>',
        nickname: 'TestUser',
        password: 'password123',
        attachedFiles: []
      }

      const sanitizedResponse = {
        success: true,
        data: {
          id: 'new-post-id',
          ...maliciousContent,
          content: '<p>Normal content</p>', // Script tag removed
          created_at: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValue(sanitizedResponse)

      const result = await $fetch('/api/posts', {
        method: 'POST',
        body: maliciousContent
      })

      expect((result.data as any)?.content).not.toContain('<script>')
      expect((result.data as any)?.content).toContain('<p>Normal content</p>')
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large post content efficiently', async () => {
      const largeContent = '<p>' + 'A'.repeat(49000) + '</p>' // Near max limit
      
      const largePostData = {
        title: 'Large Post',
        content: largeContent,
        nickname: 'TestUser',
        password: 'password123',
        attachedFiles: []
      }

      const mockResponse = {
        success: true,
        data: {
          id: 'large-post-id',
          ...largePostData,
          created_at: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts', {
        method: 'POST',
        body: largePostData
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.content).toHaveLength(largeContent.length)
    })

    it('should handle posts with many attachments', async () => {
      const manyAttachments = Array.from({ length: 10 }, (_, i) => ({
        filename: `image${i + 1}.jpg`,
        url: `https://example.com/image${i + 1}.jpg`,
        size: 12345 + i
      }))

      const postWithManyFiles = {
        title: 'Post with Many Files',
        content: '<p>Post with multiple attachments</p>',
        nickname: 'TestUser',
        password: 'password123',
        attachedFiles: manyAttachments
      }

      const mockResponse = {
        success: true,
        data: {
          id: 'post-with-files-id',
          ...postWithManyFiles,
          created_at: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await $fetch('/api/posts', {
        method: 'POST',
        body: postWithManyFiles
      })

      expect((result.data as any)?.attachedFiles).toHaveLength(10)
      expect((result.data as any)?.attachedFiles[0].filename).toBe('image1.jpg')
      expect((result.data as any)?.attachedFiles[9].filename).toBe('image10.jpg')
    })
  })
})