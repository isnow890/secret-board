// plugins/error-handler.client.ts
export default defineNuxtPlugin(() => {
  // Vue 에러 핸들러
  const nuxtApp = useNuxtApp()
  
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error)
    
    // 클라이언트 에러를 서버로 전송 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      $fetch('/api/log/client-error', {
        method: 'POST',
        body: {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          info,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      }).catch(() => {
        // 로깅 실패는 무시 (무한 루프 방지)
      })
    }
  }
  
  // 처리되지 않은 Promise rejection 핸들러
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection:', event.reason)
      
      if (process.env.NODE_ENV === 'development') {
        $fetch('/api/log/client-error', {
          method: 'POST',
          body: {
            error: {
              message: event.reason?.message || 'Unhandled Promise Rejection',
              stack: event.reason?.stack || 'No stack trace',
              name: 'UnhandledPromiseRejection'
            },
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
          }
        }).catch(() => {
          // 로깅 실패는 무시
        })
      }
    })
  }
})