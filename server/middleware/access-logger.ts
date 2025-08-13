// server/middleware/access-logger.ts
import { logRequest } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  // 정적 파일 및 개발 관련 요청 필터링
  const url = getRequestURL(event)
  const pathname = url.pathname
  
  // 로깅하지 않을 경로들
  const skipPaths = [
    '/_nuxt/',     // Nuxt 에셋
    '/favicon.ico',
    '/robots.txt',
    '/__nuxt_error', // Nuxt 에러 페이지
    '/api/_nuxt/',   // Nuxt API 내부
    '/manifest.json',
    '/sw.js',      // Service worker
    '.css',
    '.js',
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
  ]
  
  // 정적 파일이나 제외 경로는 스킵
  const shouldSkip = skipPaths.some(path => 
    pathname.includes(path) || pathname.endsWith(path)
  )
  
  if (shouldSkip) {
    return
  }
  
  const startTime = Date.now()
  
  // 응답 후 로깅을 위한 hook 설정
  event.node.res.on('finish', () => {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    try {
      // 익명 게시판이므로 IP 주소는 로깅하지 않음
      logRequest(event.node.req, {
        responseTime,
        statusCode: event.node.res.statusCode,
        contentLength: event.node.res.getHeader('content-length'),
        // IP 관련 정보는 의도적으로 제외
      })
    } catch (error) {
      console.error('Access logging error:', error)
    }
  })
})