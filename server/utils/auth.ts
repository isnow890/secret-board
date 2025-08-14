/**
 * @description 인증 및 비밀번호 관리 유틸리티
 * 기존 코드와 병행 실행을 위해 새로 생성된 유틸리티입니다.
 */
import bcrypt from 'bcryptjs';

/**
 * 비밀번호 해싱을 위한 기본 salt rounds
 */
const DEFAULT_SALT_ROUNDS = 10;

/**
 * 비밀번호 해싱
 * @param password 원본 비밀번호
 * @param saltRounds salt rounds (기본값: 10)
 * @returns 해싱된 비밀번호
 */
export async function hashPassword(password: string, saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<string> {
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호 검증
 * @param password 입력된 비밀번호
 * @param hashedPassword 저장된 해시된 비밀번호
 * @returns 비밀번호 일치 여부
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 게시글 작성자 검증
 * @param inputPassword 입력된 비밀번호
 * @param storedHash 저장된 해시
 * @returns 작성자 여부
 */
export async function verifyPostAuthor(inputPassword: string, storedHash: string): Promise<boolean> {
  try {
    return await comparePassword(inputPassword, storedHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * 댓글 작성자 검증
 * @param inputPassword 입력된 비밀번호
 * @param storedHash 저장된 해시
 * @returns 작성자 여부
 */
export async function verifyCommentAuthor(inputPassword: string, storedHash: string): Promise<boolean> {
  try {
    return await comparePassword(inputPassword, storedHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * 안전한 비밀번호 검증 (타이밍 공격 방지)
 * @param inputPassword 입력된 비밀번호
 * @param storedHash 저장된 해시
 * @returns 비밀번호 일치 여부
 */
export async function safeComparePassword(inputPassword: string, storedHash: string): Promise<boolean> {
  try {
    // 빈 해시에 대한 더미 연산으로 타이밍 공격 방지
    if (!storedHash) {
      await bcrypt.compare(inputPassword, '$2a$10$invalid.hash.to.prevent.timing.attacks');
      return false;
    }
    
    return await bcrypt.compare(inputPassword, storedHash);
  } catch (error) {
    console.error('Safe password comparison error:', error);
    return false;
  }
}

/**
 * 비밀번호 검증 및 에러 처리
 * @param inputPassword 입력된 비밀번호
 * @param storedHash 저장된 해시
 * @param resourceType 리소스 타입 (게시글, 댓글 등)
 * @throws createError 비밀번호가 틀린 경우 401 에러
 */
export async function validatePasswordOrThrow(
  inputPassword: string, 
  storedHash: string, 
  resourceType: string = '리소스'
): Promise<void> {
  const isValid = await safeComparePassword(inputPassword, storedHash);
  
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: `${resourceType} 비밀번호가 일치하지 않습니다.`,
    });
  }
}

/**
 * 글쓴이 여부 확인 (게시글-댓글 간)
 * @param commentPassword 댓글 작성시 입력한 비밀번호
 * @param postPasswordHash 게시글의 비밀번호 해시
 * @returns 글쓴이 여부
 */
export async function checkIsAuthor(
  commentPassword: string, 
  postPasswordHash: string
): Promise<boolean> {
  try {
    return await comparePassword(commentPassword, postPasswordHash);
  } catch (error) {
    console.error('Author check error:', error);
    return false;
  }
}

/**
 * 비밀번호 강도 검증 (선택적 사용)
 * @param password 검증할 비밀번호
 * @returns 강도 점수 (0-4)
 */
export function getPasswordStrength(password: string): number {
  let score = 0;
  
  if (password.length >= 4) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  return Math.min(score, 4);
}

/**
 * 익명 게시판용 비밀번호 검증 (4자리 숫자만)
 * @param password 검증할 비밀번호
 * @returns 유효성 여부
 */
export function isValidBoardPassword(password: string): boolean {
  return /^[0-9]{4}$/.test(password);
}

/**
 * 안전한 해시 생성 (게시글/댓글 작성용)
 * @param password 원본 비밀번호
 * @returns 해싱된 비밀번호
 */
export async function createSecureHash(password: string): Promise<string> {
  if (!isValidBoardPassword(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: '비밀번호는 4자리 숫자여야 합니다.',
    });
  }
  
  return await hashPassword(password);
}