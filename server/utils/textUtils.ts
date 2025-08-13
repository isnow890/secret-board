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