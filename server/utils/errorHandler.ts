/**
 * @description 공통 에러 처리 유틸리티
 * 기존 코드와 병행 실행을 위해 새로 생성된 유틸리티입니다.
 */

/**
 * 에러 로깅을 위한 인터페이스
 */
interface ErrorContext {
  method?: string;
  endpoint?: string;
  responseTime?: number;
  query?: any;
  body?: any;
  userAgent?: string;
  ip?: string;
}

/**
 * 표준 에러 처리 함수
 * @param error 발생한 에러
 * @param context 에러 컨텍스트 정보
 * @param customMessage 사용자 정의 메시지
 * @returns H3 에러 응답
 */
export function handleApiError(
  error: any, 
  context?: ErrorContext,
  customMessage?: string
): never {
  // 에러 로깅
  console.error('API Error:', {
    message: error?.message,
    stack: error?.stack,
    statusCode: error?.statusCode,
    context,
    timestamp: new Date().toISOString(),
  });

  // 이미 createError로 생성된 에러는 그대로 던짐
  if (error?.statusCode) {
    throw error;
  }

  // Zod 검증 에러 처리
  if (error?.name === 'ZodError' || error?.issues) {
    const firstError = error.issues?.[0];
    throw createError({
      statusCode: 400,
      statusMessage: firstError?.message || '입력값이 올바르지 않습니다.',
      data: {
        validationErrors: error.issues,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Supabase 에러 처리
  if (error?.code === 'PGRST116') {
    throw createError({
      statusCode: 404,
      statusMessage: '요청한 리소스를 찾을 수 없습니다.',
    });
  }

  // 기본 서버 에러
  throw createError({
    statusCode: 500,
    statusMessage: customMessage || '서버 오류가 발생했습니다.',
    data: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * 표준 try-catch 래퍼 함수
 * @param asyncFn 실행할 비동기 함수
 * @param context 에러 컨텍스트
 * @param customErrorMessage 사용자 정의 에러 메시지
 * @returns 함수 실행 결과
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context?: ErrorContext,
  customErrorMessage?: string
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    handleApiError(error, context, customErrorMessage);
  }
}

/**
 * API 핸들러 래퍼 (표준 에러 처리 포함)
 * @param handler API 핸들러 함수
 * @param options 옵션
 * @returns 래핑된 핸들러
 */
export function createApiHandler<T>(
  handler: (event: any) => Promise<T>,
  options?: {
    method?: string;
    requireAuth?: boolean;
    customErrorMessage?: string;
  }
) {
  return defineEventHandler(async (event: any) => {
    const startTime = Date.now();
    
    try {
      // 메서드 검증
      if (options?.method && getMethod(event) !== options.method) {
        throw createError({
          statusCode: 405,
          statusMessage: `${options.method} 메서드만 허용됩니다.`,
        });
      }

      // API 키 검증 (필요한 경우)
      if (options?.requireAuth) {
        const { validateApiKey } = await import('./apiKeyValidation');
        validateApiKey(event);
      }

      // 핸들러 실행
      const result = await handler(event);
      
      // 성공 로깅 (필요한 경우)
      const responseTime = Date.now() - startTime;
      if (responseTime > 1000) { // 1초 이상 걸린 요청만 로깅
        console.log('Slow API call:', {
          method: getMethod(event),
          url: event.node.req.url,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      }

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      handleApiError(error, {
        method: getMethod(event),
        endpoint: event.node.req.url,
        responseTime,
        query: getQuery(event),
        userAgent: getHeader(event, 'user-agent'),
      }, options?.customErrorMessage);
    }
  });
}

/**
 * 데이터베이스 에러 처리
 * @param error Supabase 에러
 * @param operation 수행한 작업명
 * @returns H3 에러 응답
 */
export function handleDatabaseError(error: any, operation: string = '데이터베이스 작업'): never {
  console.error(`Database error during ${operation}:`, error);

  // Supabase 특정 에러 코드 처리
  switch (error?.code) {
    case 'PGRST116':
      throw createError({
        statusCode: 404,
        statusMessage: '요청한 데이터를 찾을 수 없습니다.',
      });
    
    case '23505': // unique_violation
      throw createError({
        statusCode: 409,
        statusMessage: '중복된 데이터입니다.',
      });
    
    case '23503': // foreign_key_violation
      throw createError({
        statusCode: 400,
        statusMessage: '참조 무결성 오류가 발생했습니다.',
      });
    
    case '23514': // check_violation
      throw createError({
        statusCode: 400,
        statusMessage: '데이터 검증 오류가 발생했습니다.',
      });
    
    default:
      throw createError({
        statusCode: 500,
        statusMessage: `${operation} 중 오류가 발생했습니다.`,
      });
  }
}

/**
 * 파일 업로드 에러 처리
 * @param error 파일 업로드 에러
 * @param fileType 파일 타입
 * @returns H3 에러 응답
 */
export function handleFileUploadError(error: any, fileType: string = '파일'): never {
  console.error('File upload error:', error);

  if (error?.message?.includes('size')) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fileType} 크기가 너무 큽니다.`,
    });
  }

  if (error?.message?.includes('type') || error?.message?.includes('format')) {
    throw createError({
      statusCode: 400,
      statusMessage: `지원하지 않는 ${fileType} 형식입니다.`,
    });
  }

  throw createError({
    statusCode: 500,
    statusMessage: `${fileType} 업로드에 실패했습니다.`,
  });
}

/**
 * 외부 API 에러 처리 (AI, Storage 등)
 * @param error 외부 API 에러
 * @param service 서비스명
 * @returns H3 에러 응답
 */
export function handleExternalApiError(error: any, service: string): never {
  console.error(`External API error (${service}):`, error);

  if (error?.message?.includes('API key') || error?.status === 401) {
    throw createError({
      statusCode: 401,
      statusMessage: `${service} API 인증 오류입니다.`,
    });
  }

  if (error?.message?.includes('quota') || error?.message?.includes('limit') || error?.status === 429) {
    throw createError({
      statusCode: 429,
      statusMessage: `${service} API 사용량 초과입니다. 나중에 다시 시도해주세요.`,
    });
  }

  throw createError({
    statusCode: 500,
    statusMessage: `${service} 서비스 오류가 발생했습니다.`,
  });
}