// server/api/log/client-error.post.ts
import { logError } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  // 개발 환경에서만 클라이언트 에러 로깅 허용
  if (process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found'
    })
  }
  
  try {
    const body = await readBody(event)
    
    // 클라이언트에서 전송된 에러 정보
    const { error, info, timestamp, url, userAgent } = body
    
    // 에러 객체 재구성
    const clientError = new Error(error.message || 'Client Error')
    clientError.name = error.name || 'ClientError'
    clientError.stack = error.stack || 'No stack trace'
    
    // 컨텍스트 정보 (IP 주소는 제외)
    const context = {
      type: 'client_error',
      url,
      userAgent,
      info,
      timestamp
    }
    
    logError(clientError, context)
    
    return { success: true }
  } catch (err) {
    console.error('Failed to log client error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to log client error'
    })
  }
})