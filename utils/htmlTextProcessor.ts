// utils/htmlTextProcessor.ts
/**
 * HTML 콘텐츠에서 텍스트만 추출하고 미디어 요소는 보존하는 유틸리티
 */

interface MediaElement {
  type: 'image' | 'link' | 'youtube' | 'video' | 'other';
  placeholder: string;
  originalHtml: string;
  position: number;
}

export class HtmlTextProcessor {
  private mediaElements: MediaElement[] = [];
  private placeholderPrefix = '__MEDIA_PLACEHOLDER_';
  
  /**
   * HTML에서 텍스트를 추출하고 미디어 요소를 플레이스홀더로 대체
   */
  extractTextWithPlaceholders(html: string): string {
    this.mediaElements = [];
    let processedHtml = html;
    let placeholderIndex = 0;

    // 이미지 태그 처리
    processedHtml = processedHtml.replace(/<img[^>]*>/gi, (match) => {
      const placeholder = `${this.placeholderPrefix}${placeholderIndex}__`;
      this.mediaElements.push({
        type: 'image',
        placeholder,
        originalHtml: match,
        position: placeholderIndex
      });
      placeholderIndex++;
      return ` ${placeholder} `;
    });

    // 링크 태그 처리 (YouTube 링크 포함)
    processedHtml = processedHtml.replace(/<a[^>]*href[^>]*>.*?<\/a>/gi, (match) => {
      const isYoutube = match.includes('youtube.com') || match.includes('youtu.be');
      const placeholder = `${this.placeholderPrefix}${placeholderIndex}__`;
      
      this.mediaElements.push({
        type: isYoutube ? 'youtube' : 'link',
        placeholder,
        originalHtml: match,
        position: placeholderIndex
      });
      placeholderIndex++;
      return ` ${placeholder} `;
    });

    // iframe 태그 처리 (YouTube 임베드 등)
    processedHtml = processedHtml.replace(/<iframe[^>]*>.*?<\/iframe>/gi, (match) => {
      const placeholder = `${this.placeholderPrefix}${placeholderIndex}__`;
      this.mediaElements.push({
        type: 'youtube',
        placeholder,
        originalHtml: match,
        position: placeholderIndex
      });
      placeholderIndex++;
      return ` ${placeholder} `;
    });

    // 비디오 태그 처리
    processedHtml = processedHtml.replace(/<video[^>]*>.*?<\/video>/gi, (match) => {
      const placeholder = `${this.placeholderPrefix}${placeholderIndex}__`;
      this.mediaElements.push({
        type: 'video',
        placeholder,
        originalHtml: match,
        position: placeholderIndex
      });
      placeholderIndex++;
      return ` ${placeholder} `;
    });

    // HTML 태그 제거하고 순수 텍스트 추출
    const textContent = processedHtml
      .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
      .replace(/\s+/g, ' ') // 연속 공백을 하나로
      .trim();

    return textContent;
  }

  /**
   * AI 처리된 텍스트에 미디어 요소를 다시 삽입
   */
  restoreMediaElements(revisedText: string): string {
    let restoredContent = revisedText;

    // 플레이스홀더를 원본 HTML로 복원
    this.mediaElements.forEach((element) => {
      restoredContent = restoredContent.replace(
        new RegExp(element.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        element.originalHtml
      );
    });

    return restoredContent;
  }

  /**
   * 미디어 요소 정보 반환
   */
  getMediaElements(): MediaElement[] {
    return this.mediaElements;
  }

  /**
   * HTML을 간단한 텍스트로 변환 (미디어 요소 모두 제거)
   */
  static htmlToPlainText(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
      .replace(/\s+/g, ' ') // 연속 공백을 하나로
      .trim();
  }

  /**
   * 플레인 텍스트를 간단한 HTML로 변환 (줄바꿈을 <br>로)
   */
  static plainTextToHtml(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\r/g, '');
  }
}

/**
 * TiptapEditor 콘텐츠 처리를 위한 헬퍼 함수들
 */
export const tiptapUtils = {
  /**
   * 방식 1: 단순 텍스트 추출 (미디어 요소 제거)
   */
  extractPlainText(html: string): string {
    return HtmlTextProcessor.htmlToPlainText(html);
  },

  /**
   * 방식 2: 미디어 요소 보존하며 텍스트만 처리
   */
  processWithMediaPreservation(html: string, revisedText: string): {
    plainText: string;
    processor: HtmlTextProcessor;
  } {
    const processor = new HtmlTextProcessor();
    const plainText = processor.extractTextWithPlaceholders(html);
    
    return {
      plainText,
      processor
    };
  },

  /**
   * 처리된 텍스트를 다시 HTML로 변환
   */
  restoreToHtml(processor: HtmlTextProcessor, revisedText: string): string {
    // 먼저 미디어 요소 복원
    const withMedia = processor.restoreMediaElements(revisedText);
    
    // 줄바꿈을 HTML로 변환
    return HtmlTextProcessor.plainTextToHtml(withMedia);
  }
};