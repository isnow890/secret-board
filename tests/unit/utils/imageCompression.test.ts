// tests/unit/utils/imageCompression.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageCompressor } from '~/utils/imageCompression'

// Mock HTML5 Canvas API
class MockCanvas {
  width = 0
  height = 0
  private context = {
    drawImage: vi.fn(),
  }

  getContext() {
    return this.context
  }

  toDataURL(type: string) {
    return `data:${type};base64,mock-data`
  }

  toBlob(callback: (blob: Blob | null) => void, type: string) {
    const mockBlob = new Blob(['mock-image-data'], { type })
    callback(mockBlob)
  }
}

// Mock Image
class MockImage {
  width = 800
  height = 600
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  
  set src(value: string) {
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 10)
  }
}

// Mock URL
const mockURL = {
  createObjectURL: vi.fn(() => 'mock-object-url'),
  revokeObjectURL: vi.fn()
}

describe('ImageCompressor', () => {
  beforeEach(() => {
    // Mock global objects
    global.document = {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return new MockCanvas()
        }
        return {}
      })
    } as any

    global.Image = MockImage as any
    global.URL = mockURL as any

    vi.clearAllMocks()
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(ImageCompressor.formatFileSize(0)).toBe('0 Bytes')
      expect(ImageCompressor.formatFileSize(500)).toBe('500 Bytes')
      expect(ImageCompressor.formatFileSize(1024)).toBe('1 KB')
      expect(ImageCompressor.formatFileSize(1536)).toBe('1.5 KB')
      expect(ImageCompressor.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(ImageCompressor.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })

  describe('compress', () => {
    it('should reject non-image files', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      await expect(ImageCompressor.compress(mockFile))
        .rejects
        .toThrow('이미지 파일만 압축 가능합니다.')
    })

    it('should compress image file successfully', async () => {
      const mockFile = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' })
      
      const result = await ImageCompressor.compress(mockFile)
      
      expect(result).toBeInstanceOf(Blob)
      expect(document.createElement).toHaveBeenCalledWith('canvas')
    })

    it('should handle image load error', async () => {
      // Mock Image to trigger error
      class ErrorImage extends MockImage {
        override set src(value: string) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror()
            }
          }, 10)
        }
      }
      
      global.Image = ErrorImage as any
      
      const mockFile = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(ImageCompressor.compress(mockFile))
        .rejects
        .toThrow('이미지 로드에 실패했습니다.')
    })
  })

  describe('createPreview', () => {
    it('should reject non-image files', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      await expect(ImageCompressor.createPreview(mockFile))
        .rejects
        .toThrow('이미지 파일이 아닙니다.')
    })

    it('should create preview for image files', async () => {
      // Mock FileReader
      const mockFileReader = {
        onload: null as ((event: any) => void) | null,
        onerror: null as ((event: any) => void) | null,
        readAsDataURL: vi.fn(function(this: any) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: 'data:image/jpeg;base64,mock-preview' } })
            }
          }, 10)
        })
      }

      global.FileReader = vi.fn(() => mockFileReader) as any

      const mockFile = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' })
      
      const result = await ImageCompressor.createPreview(mockFile)
      
      expect(result).toBe('data:image/jpeg;base64,mock-preview')
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })

    it('should handle FileReader error', async () => {
      // Mock FileReader with error
      const mockFileReader = {
        onload: null as ((event: any) => void) | null,
        onerror: null as ((event: any) => void) | null,
        readAsDataURL: vi.fn(function(this: any) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror()
            }
          }, 10)
        })
      }

      global.FileReader = vi.fn(() => mockFileReader) as any

      const mockFile = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(ImageCompressor.createPreview(mockFile))
        .rejects
        .toThrow('파일 읽기에 실패했습니다.')
    })
  })
})