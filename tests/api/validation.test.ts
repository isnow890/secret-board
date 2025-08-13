// tests/api/validation.test.ts
import { describe, it, expect } from 'vitest'

// 간단한 유효성 검사 함수들
const validatePostTitle = (title: string): boolean => {
  return title.length > 0 && title.length <= 200
}

const validatePostContent = (content: string): boolean => {
  return content.length > 0
}

const validatePassword = (password: string): boolean => {
  return password.length >= 4
}

const validateCommentContent = (content: string): boolean => {
  return content.length > 0 && content.length <= 1000
}

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

describe('API Validation Functions', () => {
  describe('validatePostTitle', () => {
    it('should accept valid titles', () => {
      expect(validatePostTitle('Hello World')).toBe(true)
      expect(validatePostTitle('A')).toBe(true)
      expect(validatePostTitle('A'.repeat(200))).toBe(true)
    })

    it('should reject invalid titles', () => {
      expect(validatePostTitle('')).toBe(false)
      expect(validatePostTitle('A'.repeat(201))).toBe(false)
    })
  })

  describe('validatePostContent', () => {
    it('should accept non-empty content', () => {
      expect(validatePostContent('Hello World')).toBe(true)
      expect(validatePostContent('<p>HTML content</p>')).toBe(true)
      expect(validatePostContent('A')).toBe(true)
    })

    it('should reject empty content', () => {
      expect(validatePostContent('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('1234')).toBe(true)
      expect(validatePassword('password123')).toBe(true)
      expect(validatePassword('abcd')).toBe(true)
    })

    it('should reject short passwords', () => {
      expect(validatePassword('123')).toBe(false)
      expect(validatePassword('ab')).toBe(false)
      expect(validatePassword('')).toBe(false)
    })
  })

  describe('validateCommentContent', () => {
    it('should accept valid comments', () => {
      expect(validateCommentContent('Hello')).toBe(true)
      expect(validateCommentContent('A'.repeat(1000))).toBe(true)
    })

    it('should reject invalid comments', () => {
      expect(validateCommentContent('')).toBe(false)
      expect(validateCommentContent('A'.repeat(1001))).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true)
      expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000-extra')).toBe(false)
    })
  })
})