// tests/setup/setup.ts
import { beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, computed, readonly } from 'vue'

// Ensure NODE_ENV is set for Pinia
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test'
}

// Create global mocks for Nuxt/Vue components and composables
(global as any).vi = vi

// Mock Nuxt's auto-imported composables
vi.mock('#imports', () => ({
  useNuxtApp: vi.fn(() => ({})),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: '/',
  })),
  navigateTo: vi.fn(),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      sitePassword: 'test-password',
      supabase: {
        url: 'http://localhost:54321',
        anonKey: 'test-key',
      },
    },
  })),
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
  // Vue reactivity
  ref,
  computed,
  readonly,
}))

// Mock process.server and process.env
Object.defineProperty(global, 'process', {
  value: {
    ...process,
    server: false,
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value?.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock auth store and composable
vi.mock('~/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: readonly(ref(false)),
    loading: readonly(ref(false)),
    error: readonly(ref('')),
    isInitialized: readonly(ref(true)),
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(() => false),
    checkPasswordChange: vi.fn(() => true),
    clearAuth: vi.fn(),
  }))
}))

// useAuth composable이 제거되어 mock도 제거

// Setup fresh Pinia instance before each test
beforeEach(() => {
  // Ensure NODE_ENV is available before creating Pinia
  if (!process.env) {
    process.env = {}
  }
  process.env.NODE_ENV = 'test'
  
  // Create fresh pinia instance for each test
  const pinia = createPinia()
  setActivePinia(pinia)
  
  // Clear localStorage mock
  localStorageMock.clear()
  
  // Reset all mocks
  vi.clearAllMocks()
})