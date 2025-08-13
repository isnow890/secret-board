// tests/unit/composables/useToast.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Vue ref
vi.mock('vue', () => ({
  ref: vi.fn((val) => ({ value: val })),
  readonly: vi.fn((val) => val)
}))

describe('useToast Composable', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear any existing timers
    vi.clearAllTimers()
    vi.useFakeTimers()
    
    // Clear the shared toasts state before each test
    const { useToast } = await import('../../../composables/useToast')
    const { clear } = useToast()
    clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('add', () => {
    it('should add a toast to the list', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, toasts } = useToast()

      add({
        title: 'Test Toast',
        description: 'Test Description',
        color: 'gray'
      })

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0]).toMatchObject({
        title: 'Test Toast',
        description: 'Test Description',
        color: 'gray',
        timeout: 3000
      })
      expect(toasts.value[0]?.id).toBeDefined()
    })

    it('should add toast with custom timeout', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, toasts } = useToast()

      add({
        title: 'Custom Timeout',
        color: 'red',
        timeout: 5000
      })

      expect(toasts.value[0]?.timeout).toBe(5000)
    })

    it('should add toast without description', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, toasts } = useToast()

      add({
        title: 'No Description',
        color: 'gray'
      })

      expect(toasts.value[0]?.description).toBeUndefined()
    })

    it('should generate unique IDs for different toasts', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, toasts } = useToast()

      add({ title: 'Toast 1', color: 'gray' })
      add({ title: 'Toast 2', color: 'red' })

      expect(toasts.value).toHaveLength(2)
      expect(toasts.value[0]?.id).not.toBe(toasts.value[1]?.id)
    })

    it('should auto-remove toast after timeout', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, toasts } = useToast()

      add({
        title: 'Auto Remove',
        color: 'gray',
        timeout: 1000
      })

      expect(toasts.value).toHaveLength(1)

      // Fast forward time by 1000ms
      vi.advanceTimersByTime(1000)

      expect(toasts.value).toHaveLength(0)
    })

    it('should not auto-remove toast with 0 timeout', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, toasts } = useToast()

      add({
        title: 'No Auto Remove',
        color: 'gray',
        timeout: 0
      })

      expect(toasts.value).toHaveLength(1)

      // Fast forward time significantly
      vi.advanceTimersByTime(5000)

      expect(toasts.value).toHaveLength(1)
    })
  })

  describe('remove', () => {
    it('should remove toast by id', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, remove, toasts } = useToast()

      add({ title: 'Toast 1', color: 'gray' })
      add({ title: 'Toast 2', color: 'red' })

      expect(toasts.value).toHaveLength(2)

      const firstToastId = toasts.value[0]?.id
      remove(firstToastId || '')

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0]?.title).toBe('Toast 2')
    })

    it('should handle removing non-existent toast', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, remove, toasts } = useToast()

      add({ title: 'Test Toast', color: 'gray' })

      expect(toasts.value).toHaveLength(1)

      remove('non-existent-id')

      expect(toasts.value).toHaveLength(1)
    })

    it('should remove correct toast when multiple exist', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, remove, toasts } = useToast()

      add({ title: 'Toast 1', color: 'gray' })
      add({ title: 'Toast 2', color: 'red' })
      add({ title: 'Toast 3', color: 'gray' })

      const middleToastId = toasts.value[1]?.id
      remove(middleToastId || '')

      expect(toasts.value).toHaveLength(2)
      expect(toasts.value[0]?.title).toBe('Toast 1')
      expect(toasts.value[1]?.title).toBe('Toast 3')
    })
  })

  describe('clear', () => {
    it('should remove all toasts', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, clear, toasts } = useToast()

      add({ title: 'Toast 1', color: 'gray' })
      add({ title: 'Toast 2', color: 'red' })
      add({ title: 'Toast 3', color: 'gray' })

      expect(toasts.value).toHaveLength(3)

      clear()

      expect(toasts.value).toHaveLength(0)
    })

    it('should handle clearing empty toast list', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { clear, toasts } = useToast()

      expect(toasts.value).toHaveLength(0)

      clear()

      expect(toasts.value).toHaveLength(0)
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      const { useToast } = await import('../../../composables/useToast')
      const { add, remove, clear, toasts } = useToast()

      // Add multiple toasts
      add({ title: 'Toast 1', color: 'gray' })
      add({ title: 'Toast 2', color: 'red', timeout: 2000 })
      add({ title: 'Toast 3', color: 'gray', timeout: 0 })

      expect(toasts.value).toHaveLength(3)

      // Remove one manually
      remove(toasts.value[0]?.id || '')
      expect(toasts.value).toHaveLength(2)

      // Fast forward to trigger timeout removal
      vi.advanceTimersByTime(2000)
      expect(toasts.value).toHaveLength(1) // Only the no-timeout toast remains

      // Clear all
      clear()
      expect(toasts.value).toHaveLength(0)
    })
  })
})