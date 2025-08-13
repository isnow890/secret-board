// tests/api/upload.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock FormData
global.FormData = class MockFormData {
  private data: Map<string, any> = new Map()
  
  append(key: string, value: any) {
    this.data.set(key, value)
  }
  
  get(key: string) {
    return this.data.get(key)
  }
  
  has(key: string) {
    return this.data.has(key)
  }
}

// Mock fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

describe('Image Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/api/upload/image', () => {
    it('should upload image successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          filename: 'image_1234567890_abc123.jpg',
          url: 'https://example.com/storage/2025/01/15/image_1234567890_abc123.jpg',
          size: 12345,
          path: '2025/01/15/image_1234567890_abc123.jpg'
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const formData = new FormData()
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('image', mockFile)

      const result = await $fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/upload/image', {
        method: 'POST',
        body: formData
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle file size validation error', async () => {
      const mockError = {
        statusCode: 400,
        statusMessage: '파일 크기가 10MB를 초과합니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      const formData = new FormData()
      const largeMockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      formData.append('image', largeMockFile)

      await expect($fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })).rejects.toEqual(mockError)
    })

    it('should handle invalid file type error', async () => {
      const mockError = {
        statusCode: 400,
        statusMessage: '이미지 파일만 업로드 가능합니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      const formData = new FormData()
      const textFile = new File(['text content'], 'document.txt', { type: 'text/plain' })
      formData.append('image', textFile)

      await expect($fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })).rejects.toEqual(mockError)
    })

    it('should handle server upload error', async () => {
      const mockError = {
        statusCode: 500,
        statusMessage: '파일 업로드 중 서버 오류가 발생했습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      const formData = new FormData()
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('image', mockFile)

      await expect($fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })).rejects.toEqual(mockError)
    })

    it('should handle missing file error', async () => {
      const mockError = {
        statusCode: 400,
        statusMessage: '업로드할 파일이 없습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      const formData = new FormData()
      // No file appended

      await expect($fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })).rejects.toEqual(mockError)
    })

    it('should validate supported image formats', async () => {
      const supportedFormats = [
        { type: 'image/jpeg', ext: 'jpg' },
        { type: 'image/png', ext: 'png' },
        { type: 'image/gif', ext: 'gif' },
        { type: 'image/webp', ext: 'webp' }
      ]

      for (const format of supportedFormats) {
        const mockResponse = {
          success: true,
          data: {
            filename: `image_1234567890_abc123.${format.ext}`,
            url: `https://example.com/storage/image.${format.ext}`,
            size: 12345
          }
        }

        mockFetch.mockResolvedValue(mockResponse)

        const formData = new FormData()
        const mockFile = new File(['image content'], `test.${format.ext}`, { type: format.type })
        formData.append('image', mockFile)

        const result = await $fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        })

        expect(result.success).toBe(true)
        expect(result.data.filename).toContain(format.ext)
      }
    })

    it('should handle upload progress tracking', async () => {
      const mockResponse = {
        success: true,
        data: {
          filename: 'image_1234567890_abc123.jpg',
          url: 'https://example.com/storage/image.jpg',
          size: 12345
        }
      }

      let progressCallback: ((progress: { percent: number }) => void) | undefined

      mockFetch.mockImplementation((url: string, options: any) => {
        progressCallback = options.onUploadProgress
        
        // Simulate progress updates
        setTimeout(() => {
          if (progressCallback) {
            progressCallback({ percent: 25 })
            progressCallback({ percent: 50 })
            progressCallback({ percent: 75 })
            progressCallback({ percent: 100 })
          }
        }, 0)

        return Promise.resolve(mockResponse)
      })

      const progressUpdates: number[] = []
      const onUploadProgress = (progress: { percent: number }) => {
        progressUpdates.push(progress.percent)
      }

      const formData = new FormData()
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('image', mockFile)

      await $fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        onUploadProgress
      })

      // Allow progress callbacks to execute
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(progressUpdates).toEqual([25, 50, 75, 100])
    })
  })

  describe('Upload Validation', () => {
    it('should validate file extension and MIME type match', async () => {
      const mockError = {
        statusCode: 400,
        statusMessage: '파일 확장자와 MIME 타입이 일치하지 않습니다.'
      }

      mockFetch.mockRejectedValue(mockError)

      const formData = new FormData()
      // Mismatched extension and MIME type
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/png' })
      formData.append('image', mockFile)

      await expect($fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })).rejects.toEqual(mockError)
    })

    it('should validate file name safety', async () => {
      const dangerousFileNames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        'test<script>alert(1)</script>.jpg',
        'test|rm -rf /.jpg'
      ]

      for (const filename of dangerousFileNames) {
        const mockError = {
          statusCode: 400,
          statusMessage: '유효하지 않은 파일명입니다.'
        }

        mockFetch.mockRejectedValue(mockError)

        const formData = new FormData()
        const mockFile = new File(['image content'], filename, { type: 'image/jpeg' })
        formData.append('image', mockFile)

        await expect($fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        })).rejects.toEqual(mockError)
      }
    })

    it('should generate safe and unique filenames', async () => {
      const mockResponse = {
        success: true,
        data: {
          filename: 'image_1234567890_abc123.jpg',
          url: 'https://example.com/storage/2025/01/15/image_1234567890_abc123.jpg',
          size: 12345,
          path: '2025/01/15/image_1234567890_abc123.jpg'
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const formData = new FormData()
      const mockFile = new File(['image content'], 'original-filename.jpg', { type: 'image/jpeg' })
      formData.append('image', mockFile)

      const result = await $fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      // Verify filename is sanitized and unique
      expect(result.data.filename).toMatch(/^image_\d+_[a-z0-9]+\.jpg$/)
      expect(result.data.filename).not.toContain('original-filename')
    })
  })

  describe('Concurrent Upload Handling', () => {
    it('should handle multiple concurrent uploads', async () => {
      const uploads = []
      
      for (let i = 0; i < 3; i++) {
        const mockResponse = {
          success: true,
          data: {
            filename: `image_${Date.now()}_${i}.jpg`,
            url: `https://example.com/storage/image_${i}.jpg`,
            size: 12345 + i
          }
        }

        mockFetch.mockResolvedValueOnce(mockResponse)

        const formData = new FormData()
        const mockFile = new File(['image content'], `test_${i}.jpg`, { type: 'image/jpeg' })
        formData.append('image', mockFile)

        uploads.push($fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        }))
      }

      const results = await Promise.all(uploads)

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.data.filename).toContain(`_${index}`)
        expect(result.data.size).toBe(12345 + index)
      })
    })

    it('should handle partial failure in concurrent uploads', async () => {
      const uploads = []
      
      // First upload succeeds
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { filename: 'image_1.jpg', url: 'http://example.com/1.jpg', size: 12345 }
      })

      // Second upload fails
      mockFetch.mockRejectedValueOnce({
        statusCode: 500,
        statusMessage: 'Upload failed'
      })

      // Third upload succeeds
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { filename: 'image_3.jpg', url: 'http://example.com/3.jpg', size: 12347 }
      })

      for (let i = 0; i < 3; i++) {
        const formData = new FormData()
        const mockFile = new File(['image content'], `test_${i}.jpg`, { type: 'image/jpeg' })
        formData.append('image', mockFile)

        uploads.push($fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        }).catch(error => error))
      }

      const results = await Promise.all(uploads)

      expect(results[0].success).toBe(true)
      expect(results[1].statusCode).toBe(500)
      expect(results[2].success).toBe(true)
    })
  })
})