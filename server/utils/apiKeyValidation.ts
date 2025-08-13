// server/utils/apiKeyValidation.ts
import type { EventHandlerRequest, H3Event } from 'h3';

/**
 * API 키 검증 미들웨어
 * x-api-key 헤더를 확인하여 올바른 API 키인지 검증
 */
export function validateApiKey(event: H3Event<EventHandlerRequest>): void {
  const apiKey = getHeader(event, 'x-api-key');
  const serverApiKey = process.env.SERVER_API_KEY;

  if (!serverApiKey) {
    console.error('SERVER_API_KEY environment variable is not set');
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error'
    });
  }

  if (!apiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API key required'
    });
  }

  if (apiKey !== serverApiKey) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid API key'
    });
  }
}

/**
 * API 키 검증 데코레이터 함수
 * 기존 이벤트 핸들러를 래핑하여 API 키 검증을 추가
 */
export function withApiKeyValidation<T extends EventHandlerRequest>(
  handler: (event: H3Event<T>) => any
) {
  return defineEventHandler(async (event: H3Event<T>) => {
    // API 키 검증
    validateApiKey(event);
    
    // 원본 핸들러 실행
    return await handler(event);
  });
}