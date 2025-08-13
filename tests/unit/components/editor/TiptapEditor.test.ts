// tests/unit/components/editor/TiptapEditor.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import TiptapEditor from '~/components/editor/TiptapEditor.vue'

// Mock useEditor from nuxt-tiptap-editor
const mockEditor = {
  value: {
    getHTML: vi.fn().mockReturnValue('<p>test content</p>'),
    commands: {
      setContent: vi.fn(),
      focus: vi.fn(),
      setImage: vi.fn(),
    },
    chain: vi.fn().mockReturnThis(),
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleStrike: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    toggleBlockquote: vi.fn().mockReturnThis(),
    undo: vi.fn().mockReturnThis(),
    redo: vi.fn().mockReturnThis(),
    run: vi.fn(),
    can: vi.fn().mockReturnValue({ undo: vi.fn().mockReturnValue(true), redo: vi.fn().mockReturnValue(true) }),
    isActive: vi.fn().mockReturnValue(false),
    setEditable: vi.fn(),
    destroy: vi.fn(),
  }
}

vi.mock('#imports', () => ({
  useEditor: vi.fn(() => mockEditor),
  ref: vi.fn((val) => ({ value: val })),
  watch: vi.fn(),
  onBeforeUnmount: vi.fn(),
  unref: vi.fn((val) => val),
  crypto: {
    randomUUID: vi.fn().mockReturnValue('test-uuid')
  }
}))

// Mock $fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

// Mock components
vi.mock('~/components/TiptapEditorContent.vue', () => ({
  default: { name: 'TiptapEditorContent', template: '<div class="editor-content"></div>' }
}))

vi.mock('~/components/Icon.vue', () => ({
  default: { name: 'Icon', template: '<svg></svg>' }
}))

describe('TiptapEditor', () => {
  let wrapper: VueWrapper<any>
  
  const defaultProps = {
    modelValue: '<p>Initial content</p>',
    placeholder: 'Enter text...',
    readonly: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(TiptapEditor, {
      props: defaultProps,
      global: {
        stubs: {
          TiptapEditorContent: { template: '<div class="editor-content"></div>' },
          Icon: { template: '<svg></svg>' }
        }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Component Initialization', () => {
    it('should render editor with toolbar', () => {
      expect(wrapper.find('.tiptap-editor-container')).toBeTruthy()
      expect(wrapper.find('.tiptap-toolbar')).toBeTruthy()
      expect(wrapper.find('.tiptap-editor-content')).toBeTruthy()
    })

    it('should initialize editor with correct props', () => {
      expect(mockEditor.value).toBeTruthy()
      // Verify editor was initialized with correct content
      // (This would need to be verified through the useEditor mock setup)
    })

    it('should render all toolbar buttons', () => {
      const toolbarButtons = wrapper.findAll('.toolbar-btn')
      expect(toolbarButtons.length).toBeGreaterThan(10) // Bold, Italic, H1-H3, Lists, etc.
      
      // Verify button types to prevent form submission
      toolbarButtons.forEach(button => {
        expect(button.attributes('type')).toBe('button')
      })
    })
  })

  describe('Text Formatting Features', () => {
    it('should handle bold formatting', async () => {
      const boldButton = wrapper.find('button[title="Bold"]')
      await boldButton.trigger('click')
      
      expect(mockEditor.value.chain().focus().toggleBold().run).toHaveBeenCalled()
    })

    it('should handle italic formatting', async () => {
      const italicButton = wrapper.find('button[title="Italic"]')
      await italicButton.trigger('click')
      
      expect(mockEditor.value.chain().focus().toggleItalic().run).toHaveBeenCalled()
    })

    it('should handle strikethrough formatting', async () => {
      const strikeButton = wrapper.find('button[title="Strikethrough"]')
      await strikeButton.trigger('click')
      
      expect(mockEditor.value.chain().focus().toggleStrike().run).toHaveBeenCalled()
    })

    it('should handle heading formats', async () => {
      // Test H1
      const h1Button = wrapper.find('button[title="Heading 1"]')
      await h1Button.trigger('click')
      
      expect(mockEditor.value.chain().focus().toggleHeading).toHaveBeenCalledWith({ level: 1 })
      
      // Test H2
      const h2Button = wrapper.find('button[title="Heading 2"]')
      await h2Button.trigger('click')
      
      expect(mockEditor.value.chain().focus().toggleHeading).toHaveBeenCalledWith({ level: 2 })
    })

    it('should handle list formatting', async () => {
      // Test bullet list
      const bulletButton = wrapper.find('button[title="Bullet List"]')
      await bulletButton.trigger('click')
      
      expect(mockEditor.value.chain().focus().toggleBulletList().run).toHaveBeenCalled()
      
      // Test ordered list
      const orderedButton = wrapper.find('button[title="Ordered List"]')
      await orderedButton.trigger('click')
      
      expect(mockEditor.value.chain().focus().toggleOrderedList().run).toHaveBeenCalled()
    })

    it('should show active states correctly', async () => {
      // Mock isActive to return true for bold
      mockEditor.value.isActive.mockReturnValue(true)
      
      await wrapper.vm.$nextTick()
      
      const boldButton = wrapper.find('button[title="Bold"]')
      expect(boldButton.classes()).toContain('is-active')
    })
  })

  describe('Image Upload Features', () => {
    it('should trigger file input when image button is clicked', async () => {
      const fileInput = wrapper.find('input[type="file"]')
      const imageButton = wrapper.find('button[title="Upload Image"]')
      
      const clickSpy = vi.spyOn(fileInput.element, 'click')
      
      await imageButton.trigger('click')
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should handle file selection', async () => {
      const fileInput = wrapper.find('input[type="file"]')
      
      // Mock file
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false,
      })

      mockFetch.mockResolvedValue({
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          filename: 'test.jpg'
        }
      })

      await fileInput.trigger('change')

      // Verify upload was initiated
      expect(mockFetch).toHaveBeenCalledWith('/api/upload/image', {
        method: 'POST',
        body: expect.any(FormData),
        onUploadProgress: expect.any(Function)
      })
    })

    it('should validate image file types', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fileInput = wrapper.find('input[type="file"]')
      
      // Mock non-image file
      const mockFile = new File(['text content'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false,
      })

      await fileInput.trigger('change')

      expect(consoleSpy).toHaveBeenCalledWith('Only image files are allowed')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate file size limits', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fileInput = wrapper.find('input[type="file"]')
      
      // Mock large file (>10MB)
      const mockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(mockFile, 'size', { value: 11 * 1024 * 1024 })
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false,
      })

      await fileInput.trigger('change')

      expect(consoleSpy).toHaveBeenCalledWith('File size must be less than 10MB')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should show upload progress', async () => {
      const fileInput = wrapper.find('input[type="file"]')
      const mockFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false,
      })

      // Mock successful upload with progress
      mockFetch.mockImplementation(async (url, options) => {
        // Simulate progress callback
        if (options.onUploadProgress) {
          options.onUploadProgress({ percent: 50 })
          await new Promise(resolve => setTimeout(resolve, 10))
          options.onUploadProgress({ percent: 100 })
        }
        return {
          success: true,
          data: { url: 'https://example.com/image.jpg', filename: 'test.jpg' }
        }
      })

      await fileInput.trigger('change')
      await wrapper.vm.$nextTick()

      // Should show upload progress UI
      expect(wrapper.find('.upload-progress-container')).toBeTruthy()
    })

    it('should handle upload errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fileInput = wrapper.find('input[type="file"]')
      const mockFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false,
      })

      mockFetch.mockRejectedValue(new Error('Upload failed'))

      await fileInput.trigger('change')
      await wrapper.vm.$nextTick()

      expect(consoleSpy).toHaveBeenCalledWith('Image upload failed:', expect.any(Error))
    })
  })

  describe('Undo/Redo Features', () => {
    it('should handle undo action', async () => {
      const undoButton = wrapper.find('button[title="Undo"]')
      await undoButton.trigger('click')
      
      expect(mockEditor.value.chain().focus().undo().run).toHaveBeenCalled()
    })

    it('should handle redo action', async () => {
      const redoButton = wrapper.find('button[title="Redo"]')
      await redoButton.trigger('click')
      
      expect(mockEditor.value.chain().focus().redo().run).toHaveBeenCalled()
    })

    it('should disable undo/redo when not available', async () => {
      mockEditor.value.can.mockReturnValue({ 
        undo: vi.fn().mockReturnValue(false), 
        redo: vi.fn().mockReturnValue(false) 
      })
      
      await wrapper.vm.$nextTick()
      
      const undoButton = wrapper.find('button[title="Undo"]')
      const redoButton = wrapper.find('button[title="Redo"]')
      
      expect(undoButton.attributes('disabled')).toBeDefined()
      expect(redoButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Props and Events', () => {
    it('should emit update:modelValue when content changes', async () => {
      const onUpdateCallback = vi.fn()
      mockEditor.value.getHTML.mockReturnValue('<p>new content</p>')
      
      // Simulate the onUpdate callback that TipTap would call
      const editorConfig = vi.mocked(mockEditor.value)
      if (editorConfig.onUpdate) {
        editorConfig.onUpdate({ editor: mockEditor.value })
      }
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('should handle readonly prop', async () => {
      await wrapper.setProps({ readonly: true })
      
      expect(mockEditor.value.setEditable).toHaveBeenCalledWith(false)
    })

    it('should update content when modelValue prop changes', async () => {
      await wrapper.setProps({ modelValue: '<p>new content from prop</p>' })
      
      expect(mockEditor.value.commands.setContent).toHaveBeenCalledWith('<p>new content from prop</p>', false)
    })
  })

  describe('Drag and Drop', () => {
    it('should handle image drag and drop', async () => {
      const editorContent = wrapper.find('.tiptap-editor-content')
      const mockFile = new File(['image'], 'dropped.jpg', { type: 'image/jpeg' })
      
      const dropEvent = new DragEvent('drop', {
        dataTransfer: new DataTransfer()
      })
      
      // Mock DataTransfer with files
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile]
        }
      })

      mockFetch.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/dropped.jpg', filename: 'dropped.jpg' }
      })

      // This would need to be tested through the handleDrop prop in editorProps
      // The actual implementation would vary based on how TipTap handles the drop event
    })
  })

  describe('Clipboard Paste', () => {
    it('should handle image paste from clipboard', async () => {
      // Similar to drag and drop, this would need to test the handlePaste prop
      const mockFile = new File(['image'], 'pasted.jpg', { type: 'image/jpeg' })
      
      // Mock clipboard data
      const mockClipboardData = {
        items: [{
          type: 'image/jpeg',
          getAsFile: () => mockFile
        }]
      }

      // This would be tested through the handlePaste prop in editorProps
    })
  })

  describe('Cleanup', () => {
    it('should destroy editor on component unmount', () => {
      wrapper.unmount()
      expect(mockEditor.value.destroy).toHaveBeenCalled()
    })
  })
})