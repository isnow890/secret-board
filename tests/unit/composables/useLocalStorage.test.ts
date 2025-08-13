// tests/unit/composables/useLocalStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock console.error
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('useLocalStorage Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStorageData', () => {
    it('should return parsed data from localStorage', async () => {
      const testData = ['post1', 'post2']
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(testData))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { getStorageData } = useLocalStorage()
      
      const result = getStorageData('board_viewed_posts', [])
      
      expect(localStorage.getItem).toHaveBeenCalledWith('board_viewed_posts')
      expect(result).toEqual(testData)
    })

    it('should return fallback when localStorage is empty', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(null)
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { getStorageData } = useLocalStorage()
      
      const result = getStorageData('board_viewed_posts', [])
      
      expect(result).toEqual([])
    })

    it('should return fallback on JSON parse error', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue('invalid-json')
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { getStorageData } = useLocalStorage()
      
      const result = getStorageData('board_viewed_posts', [])
      
      expect(consoleSpy).toHaveBeenCalledWith('localStorage 읽기 실패 (board_viewed_posts):', expect.any(SyntaxError))
      expect(result).toEqual([])
    })

    it('should return fallback on server side', async () => {
      Object.defineProperty(global, 'process', {
        value: { server: true },
        configurable: true
      })
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { getStorageData } = useLocalStorage()
      
      const result = getStorageData('board_viewed_posts', [])
      
      expect(result).toEqual([])
      expect(vi.mocked(localStorage).getItem).not.toHaveBeenCalled()
      
      // Restore
      Object.defineProperty(global, 'process', {
        value: { server: false },
        configurable: true
      })
    })
  })

  describe('setStorageData', () => {
    it('should save data to localStorage', async () => {
      const testData = ['post1', 'post2']
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { setStorageData } = useLocalStorage()
      
      setStorageData('board_viewed_posts', testData)
      
      expect(vi.mocked(localStorage).setItem).toHaveBeenCalledWith('board_viewed_posts', JSON.stringify(testData))
    })

    it('should handle setItem error', async () => {
      vi.mocked(localStorage).setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { setStorageData } = useLocalStorage()
      
      setStorageData('board_viewed_posts', ['post1'])
      
      expect(consoleSpy).toHaveBeenCalledWith('localStorage 쓰기 실패 (board_viewed_posts):', expect.any(Error))
    })

    it('should not call setItem on server side', async () => {
      Object.defineProperty(global, 'process', {
        value: { server: true },
        configurable: true
      })
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { setStorageData } = useLocalStorage()
      
      setStorageData('board_viewed_posts', ['post1'])
      
      expect(vi.mocked(localStorage).setItem).not.toHaveBeenCalled()
      
      // Restore
      Object.defineProperty(global, 'process', {
        value: { server: false },
        configurable: true
      })
    })
  })

  describe('addViewedPost', () => {
    it('should add new post to viewed list', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue('[]')
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { addViewedPost } = useLocalStorage()
      
      addViewedPost('post1')
      
      expect(vi.mocked(localStorage).setItem).toHaveBeenCalledWith('board_viewed_posts', JSON.stringify(['post1']))
    })

    it('should not add duplicate post', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['post1']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { addViewedPost } = useLocalStorage()
      
      addViewedPost('post1')
      
      expect(vi.mocked(localStorage).setItem).not.toHaveBeenCalled()
    })
  })

  describe('isPostViewed', () => {
    it('should return true for viewed post', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['post1', 'post2']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { isPostViewed } = useLocalStorage()
      
      const result = isPostViewed('post1')
      
      expect(result).toBe(true)
    })

    it('should return false for unviewed post', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['post1']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { isPostViewed } = useLocalStorage()
      
      const result = isPostViewed('post2')
      
      expect(result).toBe(false)
    })
  })

  describe('togglePostLike', () => {
    it('should add post to liked list', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue('[]')
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { togglePostLike } = useLocalStorage()
      
      const result = togglePostLike('post1')
      
      expect(result).toBe(true)
      expect(vi.mocked(localStorage).setItem).toHaveBeenCalledWith('board_liked_posts', JSON.stringify(['post1']))
    })

    it('should remove post from liked list', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['post1', 'post2']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { togglePostLike } = useLocalStorage()
      
      const result = togglePostLike('post1')
      
      expect(result).toBe(false)
      expect(vi.mocked(localStorage).setItem).toHaveBeenCalledWith('board_liked_posts', JSON.stringify(['post2']))
    })
  })

  describe('isPostLiked', () => {
    it('should return true for liked post', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['post1', 'post2']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { isPostLiked } = useLocalStorage()
      
      const result = isPostLiked('post1')
      
      expect(result).toBe(true)
    })

    it('should return false for unliked post', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['post1']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { isPostLiked } = useLocalStorage()
      
      const result = isPostLiked('post2')
      
      expect(result).toBe(false)
    })
  })

  describe('addLikedComment', () => {
    it('should add new comment to liked list', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue('[]')
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { addLikedComment } = useLocalStorage()
      
      addLikedComment('comment1')
      
      expect(vi.mocked(localStorage).setItem).toHaveBeenCalledWith('board_liked_comments', JSON.stringify(['comment1']))
    })

    it('should not add duplicate comment', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['comment1']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { addLikedComment } = useLocalStorage()
      
      addLikedComment('comment1')
      
      expect(vi.mocked(localStorage).setItem).not.toHaveBeenCalled()
    })
  })

  describe('isCommentLiked', () => {
    it('should return true for liked comment', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['comment1', 'comment2']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { isCommentLiked } = useLocalStorage()
      
      const result = isCommentLiked('comment1')
      
      expect(result).toBe(true)
    })

    it('should return false for unliked comment', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify(['comment1']))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { isCommentLiked } = useLocalStorage()
      
      const result = isCommentLiked('comment2')
      
      expect(result).toBe(false)
    })
  })

  describe('updateViewTimestamp', () => {
    it('should update view timestamp', async () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)
      vi.mocked(localStorage).getItem.mockReturnValue('{}')
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { updateViewTimestamp } = useLocalStorage()
      
      updateViewTimestamp('post1')
      
      expect(vi.mocked(localStorage).setItem).toHaveBeenCalledWith('board_view_timestamps', JSON.stringify({ post1: now }))
    })
  })

  describe('canIncrementView', () => {
    it('should return true for first time view', async () => {
      vi.mocked(localStorage).getItem.mockReturnValue('{}')
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { canIncrementView } = useLocalStorage()
      
      const result = canIncrementView('post1')
      
      expect(result).toBe(true)
    })

    it('should return false for recent view (within 24 hours)', async () => {
      const now = Date.now()
      const recentTime = now - (1000 * 60 * 60) // 1 hour ago
      
      vi.spyOn(Date, 'now').mockReturnValue(now)
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify({ post1: recentTime }))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { canIncrementView } = useLocalStorage()
      
      const result = canIncrementView('post1')
      
      expect(result).toBe(false)
    })

    it('should return true for old view (more than 24 hours)', async () => {
      const now = Date.now()
      const oldTime = now - (25 * 60 * 60 * 1000) // 25 hours ago
      
      vi.spyOn(Date, 'now').mockReturnValue(now)
      vi.mocked(localStorage).getItem.mockReturnValue(JSON.stringify({ post1: oldTime }))
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { canIncrementView } = useLocalStorage()
      
      const result = canIncrementView('post1')
      
      expect(result).toBe(true)
    })
  })

  describe('clearAllData', () => {
    it('should clear all localStorage keys', async () => {
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { clearAllData } = useLocalStorage()
      
      clearAllData()
      
      expect(vi.mocked(localStorage).removeItem).toHaveBeenCalledWith('board_viewed_posts')
      expect(vi.mocked(localStorage).removeItem).toHaveBeenCalledWith('board_liked_posts')
      expect(vi.mocked(localStorage).removeItem).toHaveBeenCalledWith('board_liked_comments')
      expect(vi.mocked(localStorage).removeItem).toHaveBeenCalledWith('board_view_timestamps')
    })

    it('should handle removeItem error', async () => {
      vi.mocked(localStorage).removeItem.mockImplementation((key) => {
        if (key === 'board_viewed_posts') {
          throw new Error('Remove failed')
        }
      })
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { clearAllData } = useLocalStorage()
      
      clearAllData()
      
      expect(consoleSpy).toHaveBeenCalledWith('localStorage 삭제 실패 (board_viewed_posts):', expect.any(Error))
    })
  })

  describe('exportData', () => {
    it('should export all localStorage data', async () => {
      vi.mocked(localStorage).getItem.mockImplementation((key) => {
        switch (key) {
          case 'board_viewed_posts':
            return JSON.stringify(['post1'])
          case 'board_liked_posts':
            return JSON.stringify(['post2'])
          case 'board_liked_comments':
            return JSON.stringify(['comment1'])
          case 'board_view_timestamps':
            return JSON.stringify({ post1: 123456789 })
          default:
            return null
        }
      })
      
      const { useLocalStorage } = await import('../../../composables/useLocalStorage')
      const { exportData } = useLocalStorage()
      
      const result = exportData()
      
      expect(result).toEqual({
        board_viewed_posts: ['post1'],
        board_liked_posts: ['post2'],
        board_liked_comments: ['comment1'],
        board_view_timestamps: { post1: 123456789 },
        board_last_page: 1, // Default values when not set
        board_last_params: {}
      })
    })
  })
})