// server/plugins/log-cleanup.ts
import { cleanupOldLogs } from '~/scripts/cleanup-logs'
import { log } from '~/utils/logger'

export default defineNitroPlugin(async () => {
  // 서버 시작 시 로그 정리 실행
  if (process.env.NODE_ENV === 'production') {
    try {
      log.info('Starting log cleanup on server startup...')
      await cleanupOldLogs()
    } catch (error) {
      log.error('Failed to cleanup logs on startup:', error)
    }
    
    // 매일 자정에 로그 정리 실행 (24시간 간격)
    setInterval(async () => {
      try {
        log.info('Running scheduled log cleanup...')
        await cleanupOldLogs()
      } catch (error) {
        log.error('Scheduled log cleanup failed:', error)
      }
    }, 24 * 60 * 60 * 1000) // 24시간 = 24 * 60 * 60 * 1000ms
  }
})