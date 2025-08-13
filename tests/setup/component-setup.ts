// tests/setup/component-setup.ts
import { vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

// Component testing utilities for Pinia stores
export function createMockPinia() {
  return createTestingPinia({
    createSpy: vi.fn,
    stubActions: false, // Execute real actions for better integration testing
    initialState: {
      auth: {
        isAuthenticated: false,
        isInitialized: true,
        user: null,
      }
    },
  })
}

// useAuth composable이 제거되어 mock도 제거

// Create mock store instances
export function createMockAuthStore(state = {}) {
  return {
    isAuthenticated: false,
    isInitialized: true,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    ...state,
  }
}

// Global component mocks
export const componentMocks = {
  global: {
    mocks: {
      $t: (key: string) => key, // i18n mock
    },
    stubs: {
      NuxtLink: {
        template: '<a><slot /></a>',
      },
      ClientOnly: {
        template: '<div><slot /></div>',
      },
      Icon: {
        template: '<span class="icon"></span>',
      },
    },
  },
}