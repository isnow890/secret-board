// scripts/cleanup-logs.ts
import { readdir, stat, unlink } from 'fs/promises'
import { join } from 'path'
import { log } from '../utils/logger'

const LOG_DIR = join(process.cwd(), 'logs')
const MAX_AGE_DAYS = 30

async function cleanupOldLogs() {
  try {
    const now = Date.now()
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000 // 30일을 밀리초로 변환
    
    // logs 디렉토리의 모든 파일 읽기
    const files = await readdir(LOG_DIR)
    
    let deletedCount = 0
    let totalSize = 0
    
    // 날짜별 로그 파일 패턴 (예: access-20250811.log, error-20250811.log.gz)
    const logFilePattern = /^(access|error)-\d{8}\.log(\.gz)?$/
    
    for (const file of files) {
      const filePath = join(LOG_DIR, file)
      
      try {
        const stats = await stat(filePath)
        const age = now - stats.mtime.getTime()
        
        // 날짜별 로그 파일이거나 일반 로그 파일 중 30일 이상 된 파일 삭제
        const isLogFile = logFilePattern.test(file) || file.endsWith('.log') || file.endsWith('.log.gz')
        
        if (isLogFile && age > maxAge) {
          await unlink(filePath)
          deletedCount++
          totalSize += stats.size
          
          log.info(`Deleted old log file: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB, ${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`)
        }
      } catch (error) {
        log.error(`Error processing file ${file}:`, error)
      }
    }
    
    if (deletedCount > 0) {
      log.info(`Cleanup completed: ${deletedCount} files deleted, ${(totalSize / 1024 / 1024).toFixed(2)} MB freed`)
    } else {
      log.info('No old log files to delete')
    }
  } catch (error) {
    log.error('Log cleanup failed:', error)
  }
}

// 직접 실행 시 cleanup 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupOldLogs()
}

export { cleanupOldLogs }