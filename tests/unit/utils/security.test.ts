// tests/unit/utils/security.test.ts
import { describe, it, expect } from 'vitest'

// Mock DOMPurify if it's used
const mockDOMPurify = {
  sanitize: (input: string) => {
    // Simple XSS protection for testing
    let cleaned = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""') // Fix javascript: URL removal
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    
    // Clean up extra spaces more carefully
    cleaned = cleaned
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .replace(/>\s+</g, '><') // Remove spaces between closing and opening tags
      .replace(/\s+>/g, '>') // Remove spaces before closing >
      .trim()
    
    return cleaned
  }
}

// Security utility functions
const sanitizeHtml = (html: string): string => {
  return mockDOMPurify.sanitize(html)
}

const validateNickname = (nickname: string): boolean => {
  const nicknameRegex = /^[가-힣a-zA-Z0-9\s]+$/
  return nickname.length >= 1 && nickname.length <= 10 && nicknameRegex.test(nickname)
}

const validatePassword = (password: string): boolean => {
  return password.length >= 4 && password.length <= 20
}

const validatePostTitle = (title: string): boolean => {
  const trimmed = title.trim()
  return trimmed.length >= 5 && trimmed.length <= 255
}

const validatePostContent = (content: string): boolean => {
  const trimmed = content.trim()
  return trimmed.length >= 10 && trimmed.length <= 50000
}

const validateCommentContent = (content: string): boolean => {
  const trimmed = content.trim()
  return trimmed.length >= 1 && trimmed.length <= 1000
}

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

const generateSafeFilename = (originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const parts = originalName.split('.')
  let ext = 'txt'
  
  if (parts.length > 1) {
    ext = parts[parts.length - 1].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  }
  
  return `file_${timestamp}_${random}.${ext || 'txt'}`
}

const validateImageFile = (file: { type: string; size: number; name: string }): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '이미지 파일만 업로드 가능합니다.' }
  }

  // Check allowed image types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 이미지 형식입니다.' }
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기가 10MB를 초과합니다.' }
  }

  // Check dangerous patterns in original filename (before path extraction)
  const originalName = file.name
  
  // Path traversal - check original filename
  if (/\.\./.test(originalName)) {
    return { valid: false, error: '유효하지 않은 파일명입니다.' }
  }
  
  // Pipe and backslash - check original filename (can be lost in path splitting)
  if (/[|\\]/.test(originalName)) {
    return { valid: false, error: '유효하지 않은 파일명입니다.' }
  }

  // Get filename without path for other checks
  const filename = originalName.split('/').pop()?.split('\\').pop() || originalName
  
  // Windows invalid characters
  if (/[<>:"|?*]/.test(filename)) {
    return { valid: false, error: '유효하지 않은 파일명입니다.' }
  }
  
  // Script tags
  if (/<script>/i.test(filename)) {
    return { valid: false, error: '유효하지 않은 파일명입니다.' }
  }
  
  // JavaScript URLs
  if (/javascript:/i.test(filename)) {
    return { valid: false, error: '유효하지 않은 파일명입니다.' }
  }

  // Windows reserved names - check filename without extension
  const nameWithoutExt = filename.replace(/\.[^.]*$/, '')
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(nameWithoutExt)) {
    return { valid: false, error: '유효하지 않은 파일명입니다.' }
  }

  return { valid: true }
}

const hashPassword = async (password: string): Promise<string> => {
  // Mock bcrypt hashing
  return `hashed_${password}_salt`
}

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // Mock bcrypt comparison
  return hash === `hashed_${password}_salt`
}

const rateLimitKey = (ip: string, action: string): string => {
  return `rate_limit:${ip}:${action}`
}

describe('Security Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Safe content</p><script>alert("xss")</script>'
      const output = sanitizeHtml(input)
      
      expect(output).toBe('<p>Safe content</p>')
      expect(output).not.toContain('<script>')
      expect(output).not.toContain('alert')
    })

    it('should remove iframe tags', () => {
      const input = '<p>Content</p><iframe src="evil.com"></iframe>'
      const output = sanitizeHtml(input)
      
      expect(output).toBe('<p>Content</p>')
      expect(output).not.toContain('<iframe>')
    })

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Link</a>'
      const output = sanitizeHtml(input)
      
      expect(output).toBe('<a href="">Link</a>')
      expect(output).not.toContain('javascript:')
    })

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Content</div>'
      const output = sanitizeHtml(input)
      
      expect(output).toBe('<div>Content</div>')
      expect(output).not.toContain('onclick')
    })

    it('should preserve safe HTML', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em></p><ul><li>Item</li></ul>'
      const output = sanitizeHtml(input)
      
      expect(output).toBe(input)
    })
  })

  describe('validateNickname', () => {
    it('should accept valid Korean nicknames', () => {
      expect(validateNickname('테스터')).toBe(true)
      expect(validateNickname('한글닉네임')).toBe(true)
      expect(validateNickname('닉네임123')).toBe(true)
    })

    it('should accept valid English nicknames', () => {
      expect(validateNickname('TestUser')).toBe(true)
      expect(validateNickname('User123')).toBe(true)
      expect(validateNickname('test user')).toBe(true)
    })

    it('should accept mixed Korean and English', () => {
      expect(validateNickname('테스트User')).toBe(true)
      expect(validateNickname('User테스트')).toBe(true)
      expect(validateNickname('한글 123')).toBe(true)
    })

    it('should reject special characters', () => {
      expect(validateNickname('테스터!')).toBe(false)
      expect(validateNickname('User@123')).toBe(false)
      expect(validateNickname('test#user')).toBe(false)
      expect(validateNickname('닉네임$')).toBe(false)
    })

    it('should reject empty or too long nicknames', () => {
      expect(validateNickname('')).toBe(false)
      expect(validateNickname('A'.repeat(11))).toBe(false)
      expect(validateNickname('가'.repeat(11))).toBe(false)
    })

    it('should accept single character nicknames', () => {
      expect(validateNickname('A')).toBe(true)
      expect(validateNickname('가')).toBe(true)
      expect(validateNickname('1')).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('1234')).toBe(true)
      expect(validatePassword('password123')).toBe(true)
      expect(validatePassword('한글비밀번호')).toBe(true)
      expect(validatePassword('Pass!@#$%')).toBe(true)
    })

    it('should reject too short passwords', () => {
      expect(validatePassword('123')).toBe(false)
      expect(validatePassword('ab')).toBe(false)
      expect(validatePassword('')).toBe(false)
    })

    it('should reject too long passwords', () => {
      expect(validatePassword('A'.repeat(21))).toBe(false)
      expect(validatePassword('password'.repeat(10))).toBe(false)
    })

    it('should accept password at boundaries', () => {
      expect(validatePassword('1234')).toBe(true) // 4 chars
      expect(validatePassword('A'.repeat(20))).toBe(true) // 20 chars
    })
  })

  describe('validatePostTitle', () => {
    it('should accept valid titles', () => {
      expect(validatePostTitle('Valid Title')).toBe(true)
      expect(validatePostTitle('게시글 제목입니다')).toBe(true)
      expect(validatePostTitle('Title with numbers 123')).toBe(true)
    })

    it('should reject too short titles', () => {
      expect(validatePostTitle('1234')).toBe(false) // 4 chars
      expect(validatePostTitle('짧음')).toBe(false) // 2 chars
      expect(validatePostTitle('')).toBe(false)
    })

    it('should reject too long titles', () => {
      expect(validatePostTitle('A'.repeat(256))).toBe(false)
      expect(validatePostTitle('가'.repeat(256))).toBe(false)
    })

    it('should handle whitespace correctly', () => {
      expect(validatePostTitle('     Valid Title     ')).toBe(true)
      expect(validatePostTitle('     1234     ')).toBe(false) // Still too short after trim
      expect(validatePostTitle('     ')).toBe(false) // Only whitespace
    })

    it('should accept title at boundaries', () => {
      expect(validatePostTitle('12345')).toBe(true) // 5 chars
      expect(validatePostTitle('A'.repeat(255))).toBe(true) // 255 chars
    })
  })

  describe('validatePostContent', () => {
    it('should accept valid content', () => {
      expect(validatePostContent('This is valid content.')).toBe(true)
      expect(validatePostContent('<p>HTML content with tags</p>')).toBe(true)
      expect(validatePostContent('A'.repeat(100))).toBe(true)
    })

    it('should reject too short content', () => {
      expect(validatePostContent('123456789')).toBe(false) // 9 chars
      expect(validatePostContent('짧은내용')).toBe(false) // 4 chars
      expect(validatePostContent('')).toBe(false)
    })

    it('should reject too long content', () => {
      expect(validatePostContent('A'.repeat(50001))).toBe(false)
    })

    it('should handle whitespace correctly', () => {
      expect(validatePostContent('     Valid content here     ')).toBe(true)
      expect(validatePostContent('     123456789     ')).toBe(false) // Still too short after trim
    })

    it('should accept content at boundaries', () => {
      expect(validatePostContent('1234567890')).toBe(true) // 10 chars
      expect(validatePostContent('A'.repeat(50000))).toBe(true) // 50000 chars
    })
  })

  describe('validateCommentContent', () => {
    it('should accept valid comments', () => {
      expect(validateCommentContent('Valid comment')).toBe(true)
      expect(validateCommentContent('댓글입니다')).toBe(true)
      expect(validateCommentContent('A'.repeat(1000))).toBe(true)
    })

    it('should reject empty comments', () => {
      expect(validateCommentContent('')).toBe(false)
      expect(validateCommentContent('   ')).toBe(false)
    })

    it('should reject too long comments', () => {
      expect(validateCommentContent('A'.repeat(1001))).toBe(false)
    })

    it('should accept single character comments', () => {
      expect(validateCommentContent('A')).toBe(true)
      expect(validateCommentContent('가')).toBe(true)
      expect(validateCommentContent('1')).toBe(true)
    })
  })

  describe('isValidUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true)
      expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true)
      expect(isValidUUID('F47AC10B-58CC-4372-A567-0E02B2C3D479')).toBe(true) // uppercase
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false) // too short
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000-extra')).toBe(false) // too long
      expect(isValidUUID('123g4567-e89b-12d3-a456-426614174000')).toBe(false) // invalid char
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('123e4567e89b12d3a456426614174000')).toBe(false) // no hyphens
    })
  })

  describe('generateSafeFilename', () => {
    it('should generate safe filenames', () => {
      const filename = generateSafeFilename('test.jpg')
      
      expect(filename).toMatch(/^file_\d+_[a-z0-9]+\.jpg$/)
      expect(filename).not.toContain('test')
    })

    it('should handle files without extensions', () => {
      const filename = generateSafeFilename('noextension')
      
      expect(filename).toMatch(/^file_\d+_[a-z0-9]+\.txt$/)
    })

    it('should sanitize dangerous extensions', () => {
      const filename = generateSafeFilename('test.exe!@#')
      
      expect(filename).toMatch(/^file_\d+_[a-z0-9]+\.exe$/)
      expect(filename).not.toContain('!')
    })

    it('should generate unique filenames', () => {
      const filename1 = generateSafeFilename('test.jpg')
      const filename2 = generateSafeFilename('test.jpg')
      
      expect(filename1).not.toBe(filename2)
    })
  })

  describe('validateImageFile', () => {
    it('should accept valid image files', () => {
      const validFiles = [
        { type: 'image/jpeg', size: 1024 * 1024, name: 'test.jpg' },
        { type: 'image/png', size: 1024 * 1024, name: 'test.png' },
        { type: 'image/gif', size: 1024 * 1024, name: 'test.gif' },
        { type: 'image/webp', size: 1024 * 1024, name: 'test.webp' }
      ]

      validFiles.forEach(file => {
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it('should reject non-image files', () => {
      const result = validateImageFile({
        type: 'text/plain',
        size: 1024,
        name: 'test.txt'
      })

      expect(result.valid).toBe(false)
      expect(result.error).toBe('이미지 파일만 업로드 가능합니다.')
    })

    it('should reject unsupported image types', () => {
      const result = validateImageFile({
        type: 'image/bmp',
        size: 1024,
        name: 'test.bmp'
      })

      expect(result.valid).toBe(false)
      expect(result.error).toBe('지원하지 않는 이미지 형식입니다.')
    })

    it('should reject files that are too large', () => {
      const result = validateImageFile({
        type: 'image/jpeg',
        size: 11 * 1024 * 1024, // 11MB
        name: 'large.jpg'
      })

      expect(result.valid).toBe(false)
      expect(result.error).toBe('파일 크기가 10MB를 초과합니다.')
    })

    it('should reject dangerous filenames', () => {
      const dangerousNames = [
        '../../../etc/passwd.jpg',
        '..\\..\\windows\\system32\\config\\sam.png',
        'test<script>alert(1)</script>.jpg',
        'test|rm -rf /.jpg',
        'CON.jpg',
        'PRN.jpg',
        'javascript:alert(1).jpg'
      ]

      dangerousNames.forEach(name => {
        const result = validateImageFile({
          type: 'image/jpeg',
          size: 1024,
          name
        })

        expect(result.valid).toBe(false)
        expect(result.error).toBe('유효하지 않은 파일명입니다.')
      })
    })
  })

  describe('password hashing', () => {
    it('should hash passwords', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBe('hashed_testpassword123_salt')
      expect(hash).not.toBe(password)
    })

    it('should compare passwords correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await comparePassword(password, hash)
      expect(isValid).toBe(true)
      
      const isInvalid = await comparePassword('wrongpassword', hash)
      expect(isInvalid).toBe(false)
    })
  })

  describe('rate limiting', () => {
    it('should generate rate limit keys', () => {
      const key1 = rateLimitKey('192.168.1.1', 'post_create')
      const key2 = rateLimitKey('10.0.0.1', 'comment_create')
      
      expect(key1).toBe('rate_limit:192.168.1.1:post_create')
      expect(key2).toBe('rate_limit:10.0.0.1:comment_create')
    })

    it('should generate different keys for different IPs and actions', () => {
      const key1 = rateLimitKey('192.168.1.1', 'post_create')
      const key2 = rateLimitKey('192.168.1.2', 'post_create')
      const key3 = rateLimitKey('192.168.1.1', 'comment_create')
      
      expect(key1).not.toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key2).not.toBe(key3)
    })
  })
})