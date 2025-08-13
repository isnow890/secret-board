// tests/unit/composables/useUtils.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock DOM methods for clipboard and document
global.document = {
  createElement: vi.fn(() => ({
    value: '',
    select: vi.fn(),
    innerHTML: '',
    textContent: '',
    innerText: ''
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  execCommand: vi.fn(() => true)
} as any

global.navigator = {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
} as any

global.window = {
  isSecureContext: true
} as any

// Mock process.server
vi.mock('#imports', () => ({
  process: { server: false }
}))

describe('useUtils Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatNumber', () => {
    it('should format numbers correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { formatNumber } = useUtils()

      expect(formatNumber(500)).toBe('500')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(1000000)).toBe('1.0M')
      expect(formatNumber(2500000)).toBe('2.5M')
    })

    it('should handle edge cases', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { formatNumber } = useUtils()

      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(999999)).toBe('1000.0K')
    })
  })

  describe('formatDate', () => {
    it('should format recent dates correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { formatDate } = useUtils()

      const now = new Date()
      
      // Just now (less than 1 minute)
      const justNow = new Date(now.getTime() - 30000) // 30 seconds ago
      expect(formatDate(justNow.toISOString())).toBe('방금 전')

      // Minutes ago
      const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatDate(minutesAgo.toISOString())).toBe('5분 전')

      // Hours ago
      const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
      expect(formatDate(hoursAgo.toISOString())).toBe('3시간 전')

      // Days ago
      const daysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      expect(formatDate(daysAgo.toISOString())).toBe('2일 전')
    })

    it('should format old dates with absolute format', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { formatDate } = useUtils()

      const oldDate = new Date('2023-01-15T10:30:00Z')
      const result = formatDate(oldDate.toISOString())
      
      // Should contain Korean date format elements
      expect(result).toMatch(/2023/)
    })
  })

  describe('formatAbsoluteDate', () => {
    it('should format absolute dates correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { formatAbsoluteDate } = useUtils()

      const date = new Date('2023-12-25T15:30:00Z')
      const result = formatAbsoluteDate(date.toISOString())
      
      // Just check that it contains the year and month, day may vary by timezone
      expect(result).toMatch(/2023/)
      expect(result).toMatch(/12/)
      expect(result.length).toBeGreaterThan(10) // Should be a reasonable date string
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { formatFileSize } = useUtils()

      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB') // 1.5 * 1024
      expect(formatFileSize(1048576)).toBe('1 MB') // 1024 * 1024
      expect(formatFileSize(1073741824)).toBe('1 GB') // 1024 * 1024 * 1024
    })
  })

  describe('truncateText', () => {
    it('should truncate text correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { truncateText } = useUtils()

      expect(truncateText('Hello World', 20)).toBe('Hello World')
      expect(truncateText('Hello World', 5)).toBe('Hello...')
      expect(truncateText('Hi', 10)).toBe('Hi')
      expect(truncateText('', 5)).toBe('')
    })
  })

  describe('stripHtml', () => {
    it('should strip HTML tags', async () => {
      // Mock process.server as false (client-side)
      const { useUtils } = await import('../../../composables/useUtils')
      const { stripHtml } = useUtils()

      // Mock DOM element
      const mockDiv = {
        innerHTML: '',
        textContent: 'Hello World',
        innerText: 'Hello World'
      }
      vi.mocked(document.createElement).mockReturnValue(mockDiv as any)

      const result = stripHtml('<p>Hello <strong>World</strong></p>')
      expect(result).toBe('Hello World')
    })
  })

  describe('highlightSearch', () => {
    it('should highlight search terms', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { highlightSearch } = useUtils()

      const text = 'Hello World Test'
      const result = highlightSearch(text, 'World')
      
      expect(result).toContain('<mark class="bg-yellow-200 px-1 rounded">World</mark>')
      expect(result).toBe('Hello <mark class="bg-yellow-200 px-1 rounded">World</mark> Test')
    })

    it('should handle empty search term', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { highlightSearch } = useUtils()

      const text = 'Hello World'
      expect(highlightSearch(text, '')).toBe('Hello World')
      expect(highlightSearch(text, '   ')).toBe('Hello World')
    })

    it('should escape special regex characters', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { highlightSearch } = useUtils()

      const text = 'Price: $15.99'
      const result = highlightSearch(text, '$15.99')
      
      expect(result).toContain('<mark class="bg-yellow-200 px-1 rounded">$15.99</mark>')
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { isValidUrl } = useUtils()

      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://test.org')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
      
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('just text')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should validate emails correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { isValidEmail } = useUtils()

      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.kr')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)

      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('checkPasswordStrength', () => {
    it('should check password strength correctly', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { checkPasswordStrength } = useUtils()

      // Strong password
      const strong = checkPasswordStrength('StrongPass123!')
      expect(strong.score).toBe(5)
      expect(strong.feedback).toHaveLength(0)

      // Weak password
      const weak = checkPasswordStrength('weak')
      expect(weak.score).toBe(1) // Only lowercase
      expect(weak.feedback).toContain('8자 이상이어야 합니다')
      expect(weak.feedback).toContain('특수문자를 포함해주세요')

      // Medium password
      const medium = checkPasswordStrength('Password123')
      expect(medium.score).toBe(4) // Length + lowercase + uppercase + numbers
      expect(medium.feedback).toContain('특수문자를 포함해주세요')
    })
  })

  describe('copyToClipboard', () => {
    it('should copy to clipboard using modern API', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { copyToClipboard } = useUtils()

      const result = await copyToClipboard('test text')

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
      expect(result).toBe(true)
    })

    it('should handle copy failure', async () => {
      // Mock clipboard to throw error
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Copy failed'))

      const { useUtils } = await import('../../../composables/useUtils')
      const { copyToClipboard } = useUtils()

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await copyToClipboard('test text')

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()

      // Restore
      consoleSpy.mockRestore()
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { debounce } = useUtils()

      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Call multiple times rapidly
      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast forward time
      vi.advanceTimersByTime(100)

      // Function should be called once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const { useUtils } = await import('../../../composables/useUtils')
      const { throttle } = useUtils()

      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)

      // Call multiple times rapidly
      throttledFn('arg1')
      throttledFn('arg2')
      throttledFn('arg3')

      // Function should be called once immediately
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')

      // Fast forward time and call again
      vi.advanceTimersByTime(100)
      throttledFn('arg4')

      // Function should be called again
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('arg4')
    })
  })
})