/**
 * Global type declarations for test environment
 * 
 * This file provides TypeScript type definitions for global variables
 * that are mocked in test files to avoid TypeScript compilation errors.
 */

import type { Mock } from 'vitest'

declare global {
  /** Mock implementation of Nuxt's useRuntimeConfig composable */
  var useRuntimeConfig: Mock
  
  /** Mock implementation of comments store composable */
  var useCommentsStore: Mock  
  
  /** Mock implementation of toast notification composable */
  var useToast: Mock
  
  /** Mock implementation of Nuxt's $fetch utility */
  var $fetch: Mock
}

export {}