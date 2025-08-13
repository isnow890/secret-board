// utils/logger.ts
import pino from 'pino'
import { createStream } from 'rotating-file-stream'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 로그 디렉토리 생성
const logDir = join(process.cwd(), 'logs')
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true })
}

// 로그 파일 회전 설정 (일별 로테이션)
const createRotatingStream = (baseName: string) => {
  return createStream((time) => {
    if (!time) {
      // 초기 파일명
      const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      return `${baseName}-${dateString}.log`
    }
    
    // 회전된 파일명
    const date = new Date(time)
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '')
    return `${baseName}-${dateString}.log`
  }, {
    interval: '1d', // 1일마다 로테이션
    maxFiles: 30,   // 최대 30개 파일 (30일 보존)
    compress: 'gzip', // 압축 저장
    path: logDir,
    // 날짜가 바뀔 때 새로운 파일명 생성
    intervalBoundary: true, // 정확한 시간 경계에서 로테이션
  })
}

// 일반 로그 스트림
const accessLogStream = createRotatingStream('access')

// 에러 로그 스트림
const errorLogStream = createRotatingStream('error')

// Pino 로거 설정
const pinoConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    // hostname, pid 등 기본 정보 제거 (익명성 보장)
  },
  formatters: {
    // 개인 식별 정보 제거를 위한 커스텀 포맷터
    log: (object: any) => {
      // 개인 식별 가능한 필드 제거
      const sanitized = { ...object }
      delete sanitized.ip
      delete sanitized.clientIP
      delete sanitized['x-forwarded-for']
      delete sanitized['x-real-ip']
      delete sanitized.hostname
      delete sanitized.pid
      return sanitized
    }
  },
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'ip',
      'clientIP',
      'hostname',
      'pid'
    ],
    censor: '[REDACTED]'
  }
}

// 개발 환경에서는 콘솔 출력을 위한 pretty print 사용
const streams: pino.StreamEntry[] = []

if (process.env.NODE_ENV === 'development') {
  streams.push({
    level: 'debug',
    stream: pino.destination({
      sync: false
    })
  })
}

// 일반 로그 스트림 (info 이상)
streams.push({
  level: 'info',
  stream: accessLogStream
})

// 에러 로그 스트림 (error 이상)
streams.push({
  level: 'error',
  stream: errorLogStream
})

// 멀티스트림 로거 생성
export const logger = pino(pinoConfig, pino.multistream(streams))

// 특화된 로거들
export const accessLogger = logger.child({ type: 'access' })
export const errorLogger = logger.child({ type: 'error' })
export const apiLogger = logger.child({ type: 'api' })

// 로깅 유틸리티 함수들
export const logRequest = (req: any, additionalData?: any) => {
  accessLogger.info({
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    timestamp: new Date().toISOString(),
    ...additionalData
  }, `${req.method} ${req.url}`)
}

export const logError = (error: Error, context?: any) => {
  errorLogger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    timestamp: new Date().toISOString()
  }, `Error: ${error.message}`)
}

export const logApiCall = (method: string, endpoint: string, responseTime?: number, statusCode?: number) => {
  const message = `API ${method} ${endpoint} - ${statusCode} (${responseTime}ms)`;
  apiLogger.info({
    method,
    endpoint,
    responseTime,
    statusCode,
    timestamp: new Date().toISOString()
  }, message);
}

// 로그 레벨별 편의 함수들
export const log = {
  debug: (message: string, data?: any) => logger.debug(data, message),
  info: (message: string, data?: any) => logger.info(data, message),
  warn: (message: string, data?: any) => logger.warn(data, message),
  error: (message: string, data?: any) => logger.error(data, message),
  fatal: (message: string, data?: any) => logger.fatal(data, message)
}

export default logger