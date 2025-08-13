// server/utils/errorHandler.ts

/**
 * 공통 에러 타입 정의
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND', 
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
}

/**
 * 공통 에러 생성 함수들
 */
export const errors = {
  // 400 Bad Request
  validation: (message: string, data?: any) => 
    createError({
      statusCode: 400,
      statusMessage: message,
      data: data,
    }),

  badRequest: (message: string = '잘못된 요청입니다.') =>
    createError({
      statusCode: 400,
      statusMessage: message,
    }),

  invalidId: (resource: string = 'ID') =>
    createError({
      statusCode: 400,
      statusMessage: `올바르지 않은 ${resource} 형식입니다.`,
    }),

  missingParam: (paramName: string) =>
    createError({
      statusCode: 400,
      statusMessage: `${paramName}가 필요합니다.`,
    }),

  // 401 Unauthorized  
  unauthorized: (message: string = '인증이 필요합니다.') =>
    createError({
      statusCode: 401,
      statusMessage: message,
    }),

  invalidPassword: (message: string = '비밀번호가 올바르지 않습니다.') =>
    createError({
      statusCode: 401,
      statusMessage: message,
    }),

  // 403 Forbidden
  forbidden: (message: string = '권한이 없습니다.') =>
    createError({
      statusCode: 403,
      statusMessage: message,
    }),

  // 404 Not Found
  notFound: (resource: string = '리소스') =>
    createError({
      statusCode: 404,
      statusMessage: `${resource}를 찾을 수 없습니다.`,
    }),

  postNotFound: () =>
    createError({
      statusCode: 404,
      statusMessage: '게시글을 찾을 수 없습니다.',
    }),

  commentNotFound: () =>
    createError({
      statusCode: 404,
      statusMessage: '댓글을 찾을 수 없습니다.',
    }),

  // 405 Method Not Allowed
  methodNotAllowed: (allowedMethods?: string[]) =>
    createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
      data: allowedMethods ? { allowedMethods } : undefined,
    }),

  // 409 Conflict
  conflict: (message: string) =>
    createError({
      statusCode: 409,
      statusMessage: message,
    }),

  // 500 Internal Server Error
  internal: (message: string = '서버 오류가 발생했습니다.', error?: Error) => {
    // 개발 환경에서는 상세 에러 로깅
    if (process.env.NODE_ENV === 'development' && error) {
      console.error('Internal Server Error:', error);
    }
    
    return createError({
      statusCode: 500,
      statusMessage: message,
    });
  },

  database: (operation: string = '데이터베이스 작업', error?: Error) => {
    console.error(`Database Error during ${operation}:`, error);
    
    return createError({
      statusCode: 500,
      statusMessage: `${operation} 중 오류가 발생했습니다.`,
    });
  },

  // API 관련 에러
  apiKeyMissing: () =>
    createError({
      statusCode: 401,
      statusMessage: 'API 키가 필요합니다.',
    }),

  apiKeyInvalid: () =>
    createError({
      statusCode: 401,
      statusMessage: '유효하지 않은 API 키입니다.',
    }),

  // 파일 업로드 관련 에러
  fileTooLarge: (maxSize: string) =>
    createError({
      statusCode: 413,
      statusMessage: `파일 크기가 너무 큽니다. 최대 ${maxSize}까지 가능합니다.`,
    }),

  invalidFileType: (allowedTypes: string[]) =>
    createError({
      statusCode: 400,
      statusMessage: `지원하지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`,
    }),

  // AI 관련 에러
  aiServiceUnavailable: () =>
    createError({
      statusCode: 503,
      statusMessage: 'AI 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
    }),

  aiQuotaExceeded: () =>
    createError({
      statusCode: 429,
      statusMessage: 'AI 서비스 사용 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.',
    }),
};

/**
 * 공통 에러 처리 래퍼
 */
export const withErrorHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      // 이미 createError로 생성된 에러는 그대로 throw
      if (error.statusCode) {
        throw error;
      }
      
      // 예상치 못한 에러는 내부 서버 에러로 처리
      console.error('Unexpected error:', error);
      throw errors.internal('예기치 못한 오류가 발생했습니다.', error);
    }
  };
};

/**
 * Supabase 에러 처리
 */
export const handleSupabaseError = (error: any, operation: string): never => {
  if (!error) {
    throw errors.internal('에러 정보가 없습니다.');
  }
  
  // Supabase 특정 에러 코드 처리
  switch (error.code) {
    case 'PGRST116':
      throw errors.notFound();
    case '23505':
      throw errors.conflict('이미 존재하는 데이터입니다.');
    case '23503':
      throw errors.badRequest('참조하는 데이터가 존재하지 않습니다.');
    case '23514':
      throw errors.validation('데이터 제약 조건을 위반했습니다.');
    default:
      console.error(`Supabase error during ${operation}:`, error);
      throw errors.database(operation, error);
  }
};

/**
 * bcrypt 에러 처리
 */
export const handleBcryptError = (error: any): never => {
  console.error('Bcrypt error:', error);
  throw errors.internal('비밀번호 처리 중 오류가 발생했습니다.');
};

/**
 * 파일 처리 에러 핸들링
 */
export const handleFileError = (error: any, operation: string): never => {
  console.error(`File error during ${operation}:`, error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    throw errors.fileTooLarge('10MB');
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    throw errors.invalidFileType(['jpg', 'png', 'gif', 'webp']);
  }
  
  throw errors.internal(`파일 ${operation} 중 오류가 발생했습니다.`);
};