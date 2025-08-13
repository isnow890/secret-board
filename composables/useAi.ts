// composables/useAi.ts
export interface AiReviseOptions {
  text: string;
  type?: 'html' | 'text';
  preserveMedia?: boolean;
  persona?: 'neutral' | 'formal' | 'business' | 'soft' | 'objective';
}

export interface AiReviseResponse {
  success: boolean;
  data?: {
    originalText: string;
    revisedText: string;
    preservedMedia: boolean;
    mediaElements: any[];
    type: string;
  };
  error?: string;
}

export const useAi = () => {
  /**
   * AI를 사용하여 텍스트의 말투를 익명성이 강화되도록 변경
   */
  const reviseText = async (options: AiReviseOptions): Promise<AiReviseResponse> => {
    try {
      const response = await $fetch<AiReviseResponse>('/api/ai/revise-text', {
        method: 'POST',
        body: {
          text: options.text,
          type: options.type || 'text',
          preserveMedia: options.preserveMedia || false,
          persona: options.persona || 'neutral',
        },
      });

      return response;
    } catch (error: any) {
      console.error('AI 텍스트 변경 실패:', error);
      
      // 에러 메시지 처리
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
   * HTML에서 미디어 요소가 있는지 확인
   */
  const hasMediaElements = (html: string): boolean => {
    const hasImages = /<img[^>]*>/i.test(html);
    const hasLinks = /<a[^>]*href/i.test(html);
    const hasIframes = /<iframe[^>]*>/i.test(html);
    const hasVideos = /<video[^>]*>/i.test(html);
    
    return hasImages || hasLinks || hasIframes || hasVideos;
  };

  /**
   * HTML에서 순수 텍스트 추출
   */
  const extractPlainText = (html: string): string => {
    return html.replace(/<[^>]*>/g, ' ').trim();
  };

  /**
   * 텍스트 내용이 있는지 확인
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