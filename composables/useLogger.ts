import { log } from '~/utils/logger'

/**
 * @description 서버 사이드 로깅을 위한 컴포저블입니다.
 * `utils/logger`를 래핑하여 서버 환경에서만 로그가 기록되도록 보장합니다.
 */
export const useLogger = () => {
  /**
   * @description API 호출을 기록합니다.
   * @param {string} method - HTTP 메서드 (e.g., 'GET', 'POST')
   * @param {string} endpoint - 호출된 API 엔드포인트
   * @param {any} [data] - 요청과 관련된 데이터 (선택 사항)
   */
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

  /**
   * @description API 호출 중 발생한 에러를 기록합니다.
   * @param {string} method - HTTP 메서드
   * @param {string} endpoint - 에러가 발생한 API 엔드포인트
   * @param {any} error - 발생한 에러 객체
   */
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

  /**
   * @description 주요 사용자 액션을 기록합니다.
   * @param {string} action - 사용자의 행동을 나타내는 문자열 (e.g., 'CREATE_POST')
   * @param {any} [details] - 액션과 관련된 상세 정보 (선택 사항)
   */
  const logUserAction = (action: string, details?: any) => {
    if (process.server) {
      log.info(`User Action: ${action}`, {
        action,
        timestamp: new Date().toISOString(),
        ...(details && { details })
      })
    }
  }

  /**
   * @description 일반 정보 메시지를 기록합니다.
   * @param {string} message - 기록할 메시지
   * @param {any} [data] - 메시지와 관련된 추가 데이터 (선택 사항)
   */
  const logInfo = (message: string, data?: any) => {
    if (process.server) {
      log.info(message, data)
    }
  }

  /**
   * @description 에러 메시지를 기록합니다.
   * @param {string} message - 기록할 에러 메시지
   * @param {any} [error] - 발생한 에러 객체 (선택 사항)
   */
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