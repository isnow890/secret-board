// composables/useLogger.ts
import { log } from '~/utils/logger'

export const useLogger = () => {
  const logApiCall = (method: string, endpoint: string, data?: any) => {
    if (process.server) {
      log.info(`API Call: ${method} ${endpoint}`, {
        method,
        endpoint,
        timestamp: new Date().toISOString(),
        ...(data && { data })
      })
    }
  }

  const logApiError = (method: string, endpoint: string, error: any) => {
    if (process.server) {
      log.error(`API Error: ${method} ${endpoint}`, {
        method,
        endpoint,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString()
      })
    }
  }

  const logUserAction = (action: string, details?: any) => {
    if (process.server) {
      log.info(`User Action: ${action}`, {
        action,
        timestamp: new Date().toISOString(),
        ...(details && { details })
      })
    }
  }

  const logInfo = (message: string, data?: any) => {
    if (process.server) {
      log.info(message, data)
    }
  }

  const logError = (message: string, error?: any) => {
    if (process.server) {
      log.error(message, error)
    }
  }

  return {
    logApiCall,
    logApiError,
    logUserAction,
    logInfo,
    logError
  }
}