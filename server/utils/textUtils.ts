/**
 * HTML을 순수 텍스트로 변환하는 유틸리티 함수
 */

/**
 * HTML 태그를 제거하고 순수 텍스트만 추출
 * @param html HTML 문자열
 * @returns 순수 텍스트
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 디코딩
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // 연속된 공백을 하나로 변환
  text = text.replace(/\s+/g, ' ');
  
  // 앞뒤 공백 제거
  return text.trim();
}

/**
 * 텍스트를 지정된 길이로 자르고 말줄임표 추가
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @param suffix 말줄임표 (기본값: '…')
 * @returns 잘린 텍스트
 */
export function truncateText(text: string, maxLength: number, suffix: string = '…'): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + suffix;
}

/**
 * HTML에서 텍스트 추출 후 미리보기 생성
 * @param html HTML 문자열
 * @param maxLength 최대 길이 (기본값: 160)
 * @returns 미리보기 텍스트
 */
export function createPreview(html: string, maxLength: number = 160): string {
  const plainText = stripHtml(html);
  return truncateText(plainText, maxLength);
}

/**
 * HTML 콘텐츠 보안 정리 함수
 * 위험한 태그와 속성을 제거하여 XSS 공격을 방지합니다.
 * @param html 정리할 HTML 문자열
 * @returns 정리된 HTML 문자열
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  let cleaned = html;

  // 위험한 스크립트 태그 제거
  cleaned = cleaned.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    ""
  );
  cleaned = cleaned.replace(/<embed\b[^>]*>/gi, "");
  
  // 이벤트 핸들러 제거
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  
  // javascript: URL 제거
  cleaned = cleaned.replace(/javascript:/gi, "");

  return cleaned.trim();
}