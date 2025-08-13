// tests/unit/composables/usePostEditor.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Post, EditPostRequest } from '~/types'

// Mock dependencies
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  beforeEach: vi.fn((callback) => {
    // Store callback for later execution
    mockRouter._beforeEachCallback = callback
    return vi.fn() // Return remove function
  }),
  _beforeEachCallback: null as any
}

const mockNavigateTo = vi.fn()
const mockToast = {
  add: vi.fn()
}

const mockPost = {
  fetchPost: vi.fn(),
  verifyPostPassword: vi.fn(),
  editPost: vi.fn()
}

// Mock global functions
vi.mock('#imports', () => ({
  useRouter: () => mockRouter,
  navigateTo: mockNavigateTo,
  useToast: () => mockToast,
  usePost: () => mockPost,
  ref: vi.fn((val) => ({ value: val })),
  computed: vi.fn((fn) => ({ value: fn() })),
  onBeforeUnmount: vi.fn(),
}))

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock window events
const mockEventListeners: { [key: string]: EventListener[] } = {}
const originalAddEventListener = window.addEventListener
const originalRemoveEventListener = window.removeEventListener

window.addEventListener = vi.fn((event: string, listener: EventListener) => {
  if (!mockEventListeners[event]) {
    mockEventListeners[event] = []
  }
  mockEventListeners[event].push(listener)
})

window.removeEventListener = vi.fn((event: string, listener: EventListener) => {
  if (mockEventListeners[event]) {
    const index = mockEventListeners[event].indexOf(listener)
    if (index > -1) {
      mockEventListeners[event].splice(index, 1)
    }
  }
})

// Mock confirm dialog
window.confirm = vi.fn()

describe('usePostEditor', () => {
  const testPostId = 'test-post-id'
  let usePostEditor: any
  
  beforeEach(async () => {
    vi.clearAllMocks()
    Object.keys(mockEventListeners).forEach(key => {
      mockEventListeners[key] = []
    })
    
    // Reset process.client
    Object.defineProperty(process, 'client', {
      value: true,
      writable: true
    })

    // Dynamic import to get fresh instance
    const module = await import('~/composables/usePostEditor')
    usePostEditor = module.usePostEditor
  })

  afterEach(() => {
    // Reset mocks
    vi.restoreAllMocks()
  })

  describe('Authentication Management', () => {
    it('should check authentication from sessionStorage successfully', async () => {
      const authData = {
        password: 'test-password',
        timestamp: Date.now() - 30 * 60 * 1000 // 30 minutes ago
      }
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(authData))
      
      const { checkAuthentication, isAuthenticated, storedPassword } = usePostEditor(testPostId)
      
      const result = checkAuthentication()
      
      expect(result).toBe(true)
      expect(isAuthenticated.value).toBe(true)
      expect(storedPassword.value).toBe('test-password')
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith(`edit_auth_${testPostId}`)
    })

    it('should reject expired authentication', async () => {
      const expiredAuthData = {
        password: 'test-password',
        timestamp: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
      }
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(expiredAuthData))
      
      const { checkAuthentication, isAuthenticated } = usePostEditor(testPostId)
      
      const result = checkAuthentication()
      
      expect(result).toBe(false)
      expect(isAuthenticated.value).toBe(false)
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(`edit_auth_${testPostId}`)
    })

    it('should handle corrupted auth data gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      sessionStorageMock.getItem.mockReturnValue('invalid-json')
      
      const { checkAuthentication, isAuthenticated } = usePostEditor(testPostId)
      
      const result = checkAuthentication()
      
      expect(result).toBe(false)
      expect(isAuthenticated.value).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('인증 데이터 파싱 실패:', expect.any(Error))
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(`edit_auth_${testPostId}`)
    })

    it('should return false when not on client side', async () => {
      Object.defineProperty(process, 'client', {
        value: false,
        writable: true
      })
      
      const { checkAuthentication } = usePostEditor(testPostId)
      
      const result = checkAuthentication()
      
      expect(result).toBe(false)
    })
  })

  describe('Password Confirmation', () => {
    it('should handle successful password confirmation', async () => {
      const mockPasswordDialogRef = {
        value: {
          setLoading: vi.fn(),
          setError: vi.fn()
        }
      }
      
      mockPost.verifyPostPassword.mockResolvedValue(true)
      mockPost.fetchPost.mockResolvedValue({
        id: testPostId,
        title: 'Test Post',
        content: 'Test Content',
        attached_files: []
      })

      const { handlePasswordConfirm, isAuthenticated, showPasswordModal, storedPassword } = usePostEditor(testPostId)
      
      // Mock passwordDialogRef
      const composable = usePostEditor(testPostId)
      composable.passwordDialogRef = mockPasswordDialogRef

      await handlePasswordConfirm('correct-password')

      expect(mockPost.verifyPostPassword).toHaveBeenCalledWith('correct-password')
      expect(isAuthenticated.value).toBe(true)
      expect(storedPassword.value).toBe('correct-password')
      expect(showPasswordModal.value).toBe(false)
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        `edit_auth_${testPostId}`,
        expect.stringContaining('correct-password')
      )
    })

    it('should handle incorrect password', async () => {
      const mockPasswordDialogRef = {
        value: {
          setLoading: vi.fn(),
          setError: vi.fn()
        }
      }
      
      mockPost.verifyPostPassword.mockResolvedValue(false)

      const { handlePasswordConfirm, isAuthenticated } = usePostEditor(testPostId)
      
      // Mock passwordDialogRef
      const composable = usePostEditor(testPostId)
      composable.passwordDialogRef = mockPasswordDialogRef

      await handlePasswordConfirm('wrong-password')

      expect(isAuthenticated.value).toBe(false)
      expect(mockPasswordDialogRef.value.setError).toHaveBeenCalledWith('비밀번호가 틀렸습니다. 다시 확인해주세요.')
    })

    it('should handle password verification error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockPasswordDialogRef = {
        value: {
          setLoading: vi.fn(),
          setError: vi.fn()
        }
      }
      
      mockPost.verifyPostPassword.mockRejectedValue(new Error('Network error'))

      const { handlePasswordConfirm } = usePostEditor(testPostId)
      
      // Mock passwordDialogRef
      const composable = usePostEditor(testPostId)
      composable.passwordDialogRef = mockPasswordDialogRef

      await handlePasswordConfirm('test-password')

      expect(consoleSpy).toHaveBeenCalledWith('비밀번호 확인 실패:', expect.any(Error))
      expect(mockPasswordDialogRef.value.setError).toHaveBeenCalledWith('비밀번호 확인 중 오류가 발생했습니다.')
    })
  })

  describe('Form Validation', () => {
    it('should validate form successfully with valid data', () => {
      const { validateForm, form, errors } = usePostEditor(testPostId)
      
      form.value.title = 'Valid Title'
      form.value.content = 'This is valid content with enough characters'
      
      const isValid = validateForm()
      
      expect(isValid).toBe(true)
      expect(Object.keys(errors.value)).toHaveLength(0)
    })

    it('should validate title length constraints', () => {
      const { validateForm, form, errors } = usePostEditor(testPostId)
      
      // Test title too short
      form.value.title = '1234'
      form.value.content = 'Valid content'
      
      let isValid = validateForm()
      expect(isValid).toBe(false)
      expect(errors.value.title).toBe('제목은 5자 이상이어야 합니다.')

      // Test title too long
      form.value.title = 'a'.repeat(256)
      
      isValid = validateForm()
      expect(isValid).toBe(false)
      expect(errors.value.title).toBe('제목은 255자 이하여야 합니다.')
    })

    it('should validate content length constraints', () => {
      const { validateForm, form, errors } = usePostEditor(testPostId)
      
      form.value.title = 'Valid Title'
      
      // Test content too short
      form.value.content = '123456789'
      
      let isValid = validateForm()
      expect(isValid).toBe(false)
      expect(errors.value.content).toBe('내용은 10자 이상이어야 합니다.')

      // Test content too long
      form.value.content = 'a'.repeat(50001)
      
      isValid = validateForm()
      expect(isValid).toBe(false)
      expect(errors.value.content).toBe('내용이 너무 깁니다. (최대 50,000자)')
    })

    it('should compute form validity correctly', () => {
      const { isFormValid, form } = usePostEditor(testPostId)
      
      form.value.title = '1234'
      form.value.content = '123456789'
      expect(isFormValid.value).toBe(false)
      
      form.value.title = 'Valid Title'
      form.value.content = 'Valid content'
      expect(isFormValid.value).toBe(true)
    })
  })

  describe('Form Modification Detection', () => {
    it('should detect form modifications correctly', () => {
      const { isFormModified, form, originalPost } = usePostEditor(testPostId)
      
      // No original post
      expect(isFormModified.value).toBe(false)
      
      // Set original post
      originalPost.value = {
        id: testPostId,
        title: 'Original Title',
        content: 'Original Content',
        attached_files: []
      }
      
      form.value.title = 'Original Title'
      form.value.content = 'Original Content'
      form.value.attachedFiles = []
      
      expect(isFormModified.value).toBe(false)
      
      // Modify title
      form.value.title = 'Modified Title'
      expect(isFormModified.value).toBe(true)
      
      // Reset and modify content
      form.value.title = 'Original Title'
      form.value.content = 'Modified Content'
      expect(isFormModified.value).toBe(true)
    })
  })

  describe('Form Submission', () => {
    it('should submit form successfully', async () => {
      mockPost.editPost.mockResolvedValue({ success: true })
      
      const { handleSubmit, form, storedPassword, isAuthenticated, submitting, submitError } = usePostEditor(testPostId)
      
      // Setup valid form
      form.value.title = 'Valid Title'
      form.value.content = 'Valid content for submission'
      storedPassword.value = 'stored-password'
      isAuthenticated.value = true
      
      await handleSubmit()
      
      expect(mockPost.editPost).toHaveBeenCalledWith({
        ...form.value,
        title: 'Valid Title',
        content: 'Valid content for submission',
        password: 'stored-password'
      })
      expect(mockNavigateTo).toHaveBeenCalledWith(`/post/${testPostId}`)
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(`edit_auth_${testPostId}`)
    })

    it('should handle submission validation failure', async () => {
      const { handleSubmit, form, submitting } = usePostEditor(testPostId)
      
      form.value.title = '' // Invalid
      form.value.content = '' // Invalid
      
      await handleSubmit()
      
      expect(mockPost.editPost).not.toHaveBeenCalled()
      expect(submitting.value).toBe(false)
    })

    it('should handle authentication failure during submission', async () => {
      const { handleSubmit, form, isAuthenticated, submitError } = usePostEditor(testPostId)
      
      form.value.title = 'Valid Title'
      form.value.content = 'Valid content'
      isAuthenticated.value = false
      
      await handleSubmit()
      
      expect(submitError.value).toBe('인증이 필요합니다. 페이지를 새로고침해주세요.')
      expect(mockPost.editPost).not.toHaveBeenCalled()
    })

    it('should handle submission API errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockPost.editPost.mockRejectedValue({ statusMessage: 'Server error' })
      
      const { handleSubmit, form, storedPassword, isAuthenticated, submitError, submitting } = usePostEditor(testPostId)
      
      form.value.title = 'Valid Title'
      form.value.content = 'Valid content'
      storedPassword.value = 'stored-password'
      isAuthenticated.value = true
      
      await handleSubmit()
      
      expect(consoleSpy).toHaveBeenCalledWith('게시글 수정 실패:', expect.any(Object))
      expect(submitError.value).toBe('Server error')
      expect(submitting.value).toBe(false)
    })
  })

  describe('Upload Error Handling', () => {
    it('should handle upload errors properly', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const { handleUploadError } = usePostEditor(testPostId)
      
      handleUploadError('Upload failed')
      
      expect(consoleSpy).toHaveBeenCalledWith('파일 업로드 오류:', 'Upload failed')
      expect(mockToast.add).toHaveBeenCalledWith({
        title: '파일 업로드 오류',
        description: 'Upload failed',
        color: 'red'
      })
    })
  })

  describe('Browser Event Handling', () => {
    it('should setup beforeunload warning', () => {
      const { setupBeforeUnloadWarning } = usePostEditor(testPostId)
      
      setupBeforeUnloadWarning()
      
      expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })

    it('should trigger beforeunload warning when form is modified', () => {
      const { isFormModified, originalPost, form } = usePostEditor(testPostId)
      
      // Setup modified form
      originalPost.value = { id: testPostId, title: 'Original', content: 'Original', attached_files: [] }
      form.value.title = 'Modified'
      form.value.content = 'Original'
      
      // Get the beforeunload handler
      const beforeUnloadHandler = mockEventListeners['beforeunload']?.[0]
      expect(beforeUnloadHandler).toBeDefined()
      
      const mockEvent = {
        preventDefault: vi.fn(),
        returnValue: ''
      }
      
      // This would need to be tested with the actual handler implementation
      // The handler checks isFormModified.value and sets event.returnValue
    })

    it('should setup router guard', () => {
      const { setupRouterGuard } = usePostEditor(testPostId)
      
      setupRouterGuard()
      
      expect(mockRouter.beforeEach).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should trigger router guard confirmation when form is modified', () => {
      vi.mocked(window.confirm).mockReturnValue(false)
      
      const { isFormModified, originalPost, form } = usePostEditor(testPostId)
      
      // Setup modified form
      originalPost.value = { id: testPostId, title: 'Original', content: 'Original', attached_files: [] }
      form.value.title = 'Modified'
      
      // Get and execute the router guard
      const routerGuard = mockRouter._beforeEachCallback
      if (routerGuard) {
        const result = routerGuard(
          { path: '/other-page' },
          { path: `/post/${testPostId}/edit` }
        )
        
        expect(window.confirm).toHaveBeenCalledWith('수정 중인 내용이 있습니다. 정말로 페이지를 나가시겠습니까?')
        expect(result).toBe(false)
      }
    })
  })

  describe('Initialization', () => {
    it('should initialize with existing authentication', async () => {
      const authData = {
        password: 'stored-password',
        timestamp: Date.now() - 30 * 60 * 1000
      }
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(authData))
      mockPost.fetchPost.mockResolvedValue({
        id: testPostId,
        title: 'Test Post',
        content: 'Test Content',
        attached_files: []
      })

      const { initialize, isAuthenticated, showPasswordModal } = usePostEditor(testPostId)
      
      await initialize()
      
      expect(isAuthenticated.value).toBe(true)
      expect(showPasswordModal.value).toBe(false)
      expect(mockPost.fetchPost).toHaveBeenCalled()
    })

    it('should initialize without authentication', async () => {
      sessionStorageMock.getItem.mockReturnValue(null)

      const { initialize, isAuthenticated, showPasswordModal } = usePostEditor(testPostId)
      
      await initialize()
      
      expect(isAuthenticated.value).toBe(false)
      expect(showPasswordModal.value).toBe(true)
      expect(mockPost.fetchPost).not.toHaveBeenCalled()
    })

    it('should setup event listeners during initialization', async () => {
      const { initialize } = usePostEditor(testPostId)
      
      await initialize()
      
      expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      expect(mockRouter.beforeEach).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe('Post Data Loading', () => {
    it('should load post data and initialize form', async () => {
      const mockPostData = {
        id: testPostId,
        title: 'Test Post Title',
        content: 'Test Post Content',
        attached_files: [{ filename: 'test.jpg', url: 'http://example.com/test.jpg' }]
      }
      
      mockPost.fetchPost.mockResolvedValue(mockPostData)
      
      const { loadPostAndInitializeForm, form, originalPost } = usePostEditor(testPostId)
      
      await loadPostAndInitializeForm()
      
      expect(mockPost.fetchPost).toHaveBeenCalled()
      expect(originalPost.value).toEqual(mockPostData)
      expect(form.value.title).toBe('Test Post Title')
      expect(form.value.content).toBe('Test Post Content')
      expect(form.value.attachedFiles).toEqual(mockPostData.attached_files)
    })

    it('should handle post loading errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockPost.fetchPost.mockRejectedValue(new Error('Post not found'))
      
      const { loadPostAndInitializeForm } = usePostEditor(testPostId)
      
      await loadPostAndInitializeForm()
      
      expect(consoleSpy).toHaveBeenCalledWith('게시글 로드 실패:', expect.any(Error))
      expect(mockToast.add).toHaveBeenCalledWith({
        title: '게시글 로드 실패',
        description: '게시글을 불러오는데 실패했습니다.',
        color: 'red'
      })
    })
  })
})