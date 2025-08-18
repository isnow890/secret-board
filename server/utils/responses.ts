/**
 * @description 서버 API 응답 형식 표준화 유틸리티
 * 기존 코드와 병행 실행을 위해 새로 생성된 유틸리티입니다.
 */

/**
 * 성공 응답 인터페이스
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  message?: string;
}

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  statusCode: number;
}

/**
 * 표준 성공 응답 생성
 * @param data 응답 데이터
 * @param message 선택적 메시지
 * @returns 표준화된 성공 응답
 */
export function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  return response;
}

/**
 * 표준 에러 응답 생성 (createError와 함께 사용)
 * @param statusCode HTTP 상태 코드
 * @param message 에러 메시지
 * @param data 추가 에러 데이터
 * @returns H3 createError 호출
 */
export function createErrorResponse(statusCode: number, message: string, data?: any) {
  return createError({
    statusCode,
    statusMessage: message,
    data: data ? { ...data, timestamp: new Date().toISOString() } : undefined,
  });
}

/**
 * UTF-8 인코딩 헤더 설정
 * @param event H3 이벤트 객체
 */
export function setUTF8Header(event: any): void {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8');
}

/**
 * 페이지네이션 응답 형식
 */
export interface PaginationInfo {
  currentPage?: number | null;
  totalPages?: number | null;
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string | null;
  currentSort?: string;
  searchQuery?: string | null;
}

/**
 * 페이지네이션 포함 성공 응답 생성
 * @param data 응답 데이터
 * @param pagination 페이지네이션 정보
 * @param message 선택적 메시지
 * @returns 표준화된 페이지네이션 응답
 */
export function createPaginatedResponse<T>(
  data: T,
  pagination: PaginationInfo,
  message?: string
): SuccessResponse<{ data: T; pagination: PaginationInfo }> {
  return createSuccessResponse(
    {
      data,
      pagination,
    },
    message
  );
}

/**
 * 빈 성공 응답 생성 (삭제, 수정 등에 사용)
 * @param message 성공 메시지
 * @returns 표준화된 빈 성공 응답
 */
export function createEmptySuccessResponse(message: string): SuccessResponse<null> {
  return createSuccessResponse(null, message);
}

/**
 * 카운트 응답 생성
 * @param count 개수
 * @param message 선택적 메시지
 * @returns 표준화된 카운트 응답
 */
export function createCountResponse(count: number, message?: string): SuccessResponse<{ count: number }> {
  return createSuccessResponse({ count }, message);
}

/**
 * 일반적인 에러 상황별 표준 응답들
 */
export const CommonErrors = {
  /**
   * 400 Bad Request 에러들
   */
  BadRequest: {
    InvalidUUID: (resource: string = 'ID') => 
      createErrorResponse(400, `올바르지 않은 ${resource} 형식입니다.`),
    
    MissingField: (field: string) => 
      createErrorResponse(400, `${field}가 필요합니다.`),
    
    InvalidFormat: (field: string) => 
      createErrorResponse(400, `${field} 형식이 올바르지 않습니다.`),
    
    FileTooLarge: (maxSize: string) => 
      createErrorResponse(400, `파일 크기는 ${maxSize} 이하여야 합니다.`),
    
    InvalidFileType: (allowedTypes?: string) => 
      createErrorResponse(400, `지원하지 않는 파일 형식입니다.${allowedTypes ? ` 허용 형식: ${allowedTypes}` : ''}`),
  },

  /**
   * 401 Unauthorized 에러들
   */
  Unauthorized: {
    InvalidPassword: () => 
      createErrorResponse(401, '비밀번호가 일치하지 않습니다.'),
    
    InvalidApiKey: () => 
      createErrorResponse(401, 'API key required'),
    
    InvalidCredentials: () => 
      createErrorResponse(401, '인증 정보가 올바르지 않습니다.'),
  },

  /**
   * 403 Forbidden 에러들
   */
  Forbidden: {
    NoPermission: () => 
      createErrorResponse(403, '권한이 없습니다.'),
    
    InvalidApiKey: () => 
      createErrorResponse(403, 'Invalid API key'),
  },

  /**
   * 404 Not Found 에러들
   */
  NotFound: {
    Resource: (resource: string = '리소스') => 
      createErrorResponse(404, `${resource}를 찾을 수 없습니다.`),
    
    Post: () => 
      createErrorResponse(404, '게시글을 찾을 수 없습니다.'),
    
    Comment: () => 
      createErrorResponse(404, '댓글을 찾을 수 없습니다.'),
  },

  /**
   * 405 Method Not Allowed 에러들
   */
  MethodNotAllowed: {
    Default: () => 
      createErrorResponse(405, 'Method not allowed'),
    
    OnlyPost: () => 
      createErrorResponse(405, 'POST 메서드만 허용됩니다.'),
    
    OnlyGet: () => 
      createErrorResponse(405, 'GET 메서드만 허용됩니다.'),
  },

  /**
   * 500 Internal Server Error 에러들
   */
  InternalServer: {
    Default: () => 
      createErrorResponse(500, '서버 오류가 발생했습니다.'),
    
    Database: () => 
      createErrorResponse(500, '데이터베이스 오류가 발생했습니다.'),
    
    FileUpload: () => 
      createErrorResponse(500, '파일 업로드에 실패했습니다.'),
    
    ConfigurationError: () => 
      createErrorResponse(500, 'Server configuration error'),
  },
};