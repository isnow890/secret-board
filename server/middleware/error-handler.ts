// server/middleware/error-handler.ts
import { logError } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    // 다음 미들웨어나 핸들러 실행
    // 이 미들웨어는 에러 처리를 위해 존재하므로 실제로는 아무것도 하지 않음
  } catch (error: any) {
    // 에러 로깅
    const errorContext = {
      url: getRequestURL(event).pathname,
      method: getMethod(event),
      timestamp: new Date().toISOString(),
      // IP 주소는 익명 게시판이므로 로깅하지 않음
      userAgent: getHeader(event, 'user-agent'),
      referer: getHeader(event, 'referer')
    }
    
    logError(error, errorContext)
    
    // 에러를 다시 던져서 Nuxt가 처리하도록 함
    throw error
  }
})

// 전역 에러 핸들러 (Nitro의 에러 처리)
export { logError as nitroErrorHandler }