/**
 * @description AI 기반 텍스트 수정을 위한 요청 옵션 인터페이스
 */
export interface AiReviseOptions {
  /** 수정할 원본 텍스트 */
  text: string;
  /** 텍스트 형식 (기본값: 'text') */
  type?: 'html' | 'text';
  /** 미디어(이미지, 링크 등) 태그 보존 여부 (HTML 타입일 때만 유효) */
  preserveMedia?: boolean;
  /** 적용할 글쓰기 페르소나 (기본값: 'neutral') */
  persona?: 'neutral' | 'formal' | 'business' | 'soft' | 'objective';
}

/**
 * @description AI 텍스트 수정 API의 응답 인터페이스
 */
export interface AiReviseResponse {
  /** 요청 성공 여부 */
  success: boolean;
  /** 성공 시 반환되는 데이터 */
  data?: {
    /** 원본 텍스트 */
    originalText: string;
    /** 수정된 텍스트 */
    revisedText: string;
    /** 미디어 보존 여부 */
    preservedMedia: boolean;
    /** 보존된 미디어 요소 배열 */
    mediaElements: any[];
    /** 처리된 텍스트 타입 */
    type: string;
  };
  /** 실패 시 에러 메시지 */
  error?: string;
}

/**
 * @description AI 관련 기능을 제공하는 컴포저블
 */
export const useAi = () => {
  /**
   * @description AI를 사용하여 텍스트의 말투를 익명성이 강화되도록 변경합니다.
   * @param {AiReviseOptions} options - AI 수정 요청 옵션
   * @returns {Promise<AiReviseResponse>} AI 수정 결과
   */
  const reviseText = async (options: AiReviseOptions): Promise<AiReviseResponse> => {
    try {
      const response = (await $fetch('/api/ai/revise-text', {
        method: 'POST',
        body: {
          text: options.text,
          type: options.type || 'text',
          preserveMedia: options.preserveMedia || false,
          persona: options.persona || 'neutral',
        },
      })) as AiReviseResponse;

      return response;
    } catch (error: any) {
      console.error('AI 텍스트 변경 실패:', error);
      
      let errorMessage = 'AI 말투 변경에 실패했습니다.';
      
      if (error.status === 429) {
        errorMessage = 'API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.status === 401) {
        errorMessage = 'API 키가 유효하지 않습니다.';
      } else if (error.data?.statusMessage) {
        errorMessage = error.data.statusMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * @description HTML 문자열에 미디어 관련 태그(img, a, iframe, video)가 포함되어 있는지 확인합니다.
   * @param {string} html - 검사할 HTML 문자열
   * @returns {boolean} 미디어 태그 포함 여부
   */
  const hasMediaElements = (html: string): boolean => {
    const hasImages = /<img[^>]*>/i.test(html);
    const hasLinks = /<a[^>]*href/i.test(html);
    const hasIframes = /<iframe[^>]*>/i.test(html);
    const hasVideos = /<video[^>]*>/i.test(html);
    
    return hasImages || hasLinks || hasIframes || hasVideos;
  };

  /**
   * @description HTML 문자열에서 모든 태그를 제거하고 순수 텍스트만 추출합니다.
   * @param {string} html - 변환할 HTML 문자열
   * @returns {string} 순수 텍스트
   */
  const extractPlainText = (html: string): string => {
    return html.replace(/<[^>]*>/g, ' ').trim();
  };

  /**
   * @description 주어진 콘텐츠에 실제 텍스트 내용이 있는지 확인합니다.
   * @param {string} content - 검사할 콘텐츠
   * @param {'html' | 'text'} type - 콘텐츠 타입 (기본값: 'text')
   * @returns {boolean} 텍스트 내용 존재 여부
   */
  const hasTextContent = (content: string, type: 'html' | 'text' = 'text'): boolean => {
    if (!content) return false;
    
    if (type === 'html') {
      const textContent = extractPlainText(content);
      return textContent.length > 0;
    }
    
    return content.trim().length > 0;
  };

  return {
    reviseText,
    hasMediaElements,
    extractPlainText,
    hasTextContent,
  };
};