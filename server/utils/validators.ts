/**
 * @description 서버 API에서 사용하는 공통 검증 유틸리티 함수들
 * 기존 코드와 병행 실행을 위해 새로 생성된 유틸리티입니다.
 */

/**
 * UUID v4 형식 검증
 * @param id 검증할 ID 문자열
 * @returns 유효한 UUID인지 여부
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * UUID 검증 및 에러 처리
 * @param id 검증할 ID
 * @param resourceType 리소스 타입 (게시글, 댓글 등)
 * @throws createError 유효하지 않은 경우 400 에러
 */
export function validateUUIDOrThrow(id: string | undefined, resourceType: string = 'ID'): asserts id is string {
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: `${resourceType}가 필요합니다.`,
    });
  }

  if (!isValidUUID(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: `올바르지 않은 ${resourceType} 형식입니다.`,
    });
  }
}

/**
 * HTTP 메서드 검증
 * @param event H3 이벤트 객체
 * @param allowedMethod 허용된 메서드
 * @throws createError 허용되지 않은 메서드인 경우 405 에러
 */
export function validateMethodOrThrow(event: any, allowedMethod: string): void {
  if (getMethod(event) !== allowedMethod) {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }
}

/**
 * 여러 HTTP 메서드 검증
 * @param event H3 이벤트 객체
 * @param allowedMethods 허용된 메서드 배열
 * @throws createError 허용되지 않은 메서드인 경우 405 에러
 */
export function validateMethodsOrThrow(event: any, allowedMethods: string[]): void {
  const method = getMethod(event);
  if (!allowedMethods.includes(method)) {
    throw createError({
      statusCode: 405,
      statusMessage: `Method not allowed. Allowed: ${allowedMethods.join(', ')}`,
    });
  }
}

/**
 * 비밀번호 형식 검증 (게시판 규칙: 4자리 숫자)
 * @param password 검증할 비밀번호
 * @returns 유효한 비밀번호인지 여부
 */
export function isValidPassword(password: string): boolean {
  return /^[0-9]{4}$/.test(password);
}

/**
 * 닉네임 형식 검증
 * @param nickname 검증할 닉네임
 * @returns 유효한 닉네임인지 여부
 */
export function isValidNickname(nickname: string): boolean {
  return /^[가-힣a-zA-Z0-9\s]{1,15}$/.test(nickname);
}

/**
 * 파일 크기 검증
 * @param size 파일 크기 (bytes)
 * @param maxSize 최대 허용 크기 (bytes)
 * @returns 유효한 크기인지 여부
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * 이미지 파일 타입 검증
 * @param mimeType MIME 타입
 * @returns 유효한 이미지 타입인지 여부
 */
export function isValidImageType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimeType);
}

/**
 * 업로드 파일 타입 검증
 * @param mimeType MIME 타입
 * @returns 유효한 파일 타입인지 여부
 */
export function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];
  return allowedTypes.includes(mimeType);
}