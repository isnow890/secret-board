// tests/utils/formatters.test.ts
import { describe, it, expect } from 'vitest'

// 유틸리티 함수들
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return Math.floor(num / 1000) + 'K'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

describe('Number Formatting Utils', () => {
  describe('formatNumber', () => {
    it('should format small numbers correctly', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(50)).toBe('50')
      expect(formatNumber(999)).toBe('999')
    })

    it('should format thousands correctly', () => {
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(9999)).toBe('10.0K')  // 9999 / 1000 = 9.999 -> 10.0K
    })

    it('should format ten thousands correctly', () => {
      expect(formatNumber(10000)).toBe('10K')
      expect(formatNumber(15000)).toBe('15K')
      expect(formatNumber(999999)).toBe('999K')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
      expect(formatFileSize(1000)).toBe('1000 Bytes')
    })

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(5120)).toBe('5 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(1024 * 1024 * 1024 * 2.2)).toBe('2.2 GB')
    })
  })
})