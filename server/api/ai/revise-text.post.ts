// server/api/ai/revise-text.post.ts
import { GoogleGenAI } from '@google/genai';
import { HtmlTextProcessor, tiptapUtils } from '~/utils/htmlTextProcessor';

export default defineEventHandler(async (event) => {
  try {
    // API 키 확인
    const config = useRuntimeConfig();
    const apiKey = config.googleAiStudioApiKey;
    
    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Google AI Studio API key is not configured'
      });
    }

    // 요청 본문 파싱
    const body = await readBody(event);
    const { text, type, preserveMedia = false, persona = 'neutral' } = body;

    // 입력 검증
    if (!text || typeof text !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text is required and must be a string'
      });
    }

    if (text.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text cannot be empty'
      });
    }

    if (text.length > 10000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text is too long (max 10000 characters)'
      });
    }

    // 텍스트 전처리
    let textToProcess: string;
    let processor: HtmlTextProcessor | null = null;
    
    if (preserveMedia && type === 'html') {
      // HTML에서 미디어 요소 보존하며 텍스트만 추출
      processor = new HtmlTextProcessor();
      textToProcess = processor.extractTextWithPlaceholders(text);
    } else {
      // 순수 텍스트 추출 (미디어 요소 제거)
      textToProcess = type === 'html' ? tiptapUtils.extractPlainText(text) : text;
    }

    if (textToProcess.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No text content found to process'
      });
    }

    // Google Gemini AI 초기화
    const ai = new GoogleGenAI({ apiKey });

    // 익명성 강화를 위한 말투 변경 프롬프트 생성
    const getSystemPrompt = (personaType: string) => {
      const baseRules = `
핵심 원칙: 익명성 강화를 위해 개인의 말투 특성을 제거하되, 글의 논조와 내용은 절대 변경하지 않습니다.

공통 규칙:
1. 내용의 의미와 정보는 절대 변경하지 마세요
2. 글의 논조(긍정/부정/중립)는 그대로 유지하세요
3. 플레이스홀더 텍스트(__MEDIA_PLACEHOLDER_로 시작하는 것)는 절대 수정하지 말고 그대로 유지하세요
4. 개인적 특성이 드러나는 말투만 제거하고 일반화하세요
5. 감탄사나 이모티콘은 제거하세요`;

      const personaPrompts = {
        neutral: `당신은 익명성 강화를 위해 개인적 특색을 제거하는 전문가입니다.
${baseRules}
6. 개성이 드러나는 표현을 평범하고 직접적인 표현으로 바꾸세요
7. "~네요", "~죠", "~해요" 등을 "~습니다", "~입니다"로 통일하세요
8. 과도한 감정 표현을 절제된 표현으로 바꾸되 직접적으로 표현하세요

예시:
입력: "와! 정말 좋은 아이디어네요! 꼭 해보고 싶어요 ㅎㅎ"
출력: "좋은 아이디어입니다. 해보고 싶습니다."`,

        formal: `당신은 익명성 강화를 위해 격식 있고 직접적인 말투로 표준화하는 전문가입니다.
${baseRules}
6. 모든 표현을 정중하고 예의바른 격식을 갖춘 말투로 변경하세요
7. 정중하되 직접적인 표현을 사용하세요 ("~습니다", "~입니다")
8. 반말이나 친근한 표현을 정중한 존댓말로 바꾸세요

예시:
입력: "이거 진짜 좋은데? 바로 해보자!"
출력: "이것이 좋습니다. 시도해보겠습니다."`,

        business: `당신은 익명성 강화를 위해 간결하고 직설적인 말투로 통일하는 전문가입니다.
${baseRules}
6. 불필요한 수식어와 감정적 표현을 제거하여 간결하게 만드세요
7. 핵심 내용만 직설적으로 표현하세요
8. "~합니다", "~입니다"로 통일된 어미를 사용하세요

예시:
입력: "이 방법이 정말정말 좋은 것 같아요! 완전 추천해요!"
출력: "이 방법이 좋습니다. 추천합니다."`,

        soft: `당신은 익명성 강화를 위해 부드럽고 조심스러운 말투로 통일하는 전문가입니다.
${baseRules}
6. 단정적인 표현을 "~것 같습니다", "~할 수 있을 것입니다" 등으로 부드럽게 바꾸세요
7. 강한 어조를 완곡한 표현으로 바꾸세요
8. 조심스럽고 겸손한 어조로 통일하세요

예시:
입력: "이건 완전 최고야! 무조건 해야 해!"
출력: "이것이 좋을 것 같습니다. 시도해볼 수 있을 것 같습니다."`,

        objective: `당신은 익명성 강화를 위해 객관적이고 직접적인 말투로 변경하는 전문가입니다.
${baseRules}
6. 주관적인 표현을 객관적이면서도 직접적인 표현으로 바꾸세요
7. 개인적 의견을 일반적이고 명확한 표현으로 바꾸세요
8. 감정적 표현을 사실적 서술로 바꾸되 직접적으로 표현하세요

예시:
입력: "내가 보기엔 이게 최고인 것 같아!"
출력: "이것이 좋습니다. 효과적인 방법입니다."`
      };

      return personaPrompts[personaType as keyof typeof personaPrompts] || personaPrompts.neutral;
    };

    // 익명성 강화를 위한 직접적인 말투 변환 프롬프트
    const systemPrompt = `당신은 익명성 강화를 위해 개인적 말투 특성을 제거하는 전문가입니다.

핵심 원칙: 개인을 특정할 수 없도록 말투만 조정하되, 직접적이고 자연스러운 표현을 사용합니다.

규칙:
1. 내용의 의미와 정보는 절대 변경하지 마세요
2. 글의 논조(긍정/부정/중립)는 그대로 유지하세요
3. 플레이스홀더 텍스트(__MEDIA_PLACEHOLDER_로 시작하는 것)는 절대 수정하지 말고 그대로 유지하세요
4. 개인적 특성이 드러나는 말투만 제거하고 일반화하세요
5. 감탄사나 이모티콘은 제거하세요
6. "~네요", "~죠", "~해요" 등을 "~습니다", "~입니다"로 통일하세요
7. 과도한 감정 표현을 절제된 표현으로 바꾸세요
8. 평가하는 말투("~에 대해 평가가 있다", "~라고 판단됩니다")는 피하고 직접적으로 표현하세요
9. "~것 같습니다", "~할 것으로 봅니다" 등 우회적 표현보다는 "~습니다", "~입니다"로 직접 표현하세요

예시:
입력: "우리 회사 이 부분이 진짜 문제네요! 완전히 바뀌어야 해요 ㅠㅠ"
출력: "이 부분은 문제입니다. 개선이 필요합니다."

입력: "이건 정말 좋은 아이디어인 것 같아요! 꼭 도입했으면 좋겠어요"
출력: "좋은 아이디어입니다. 도입하면 좋겠습니다."

입력: "저는 이 방법이 최고라고 생각해요"
출력: "이 방법이 좋습니다."

입력: "완전 별로인데? 다시 생각해봐야겠어"
출력: "별로입니다. 다시 생각해야 합니다."`;

    const userPrompt = `다음 텍스트를 익명성이 강화되도록 말투를 조정해주세요. 내용과 논조는 그대로 유지하면서 개인적 특성만 제거해주세요:

${textToProcess}`;

    // Gemini API 호출
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        temperature: 0.3, // 일관성 있는 결과를 위해 낮은 temperature
        maxOutputTokens: 2000,
        candidateCount: 1,
      }
    });

    let revisedText = response.text;
    
    if (!revisedText) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to generate revised text'
      });
    }

    revisedText = revisedText.trim();

    // 후처리 - 미디어 요소 복원
    let finalResult: string;
    if (processor && preserveMedia) {
      // 미디어 요소를 다시 HTML로 복원
      finalResult = tiptapUtils.restoreToHtml(processor, revisedText);
    } else if (type === 'html' && !preserveMedia) {
      // 순수 텍스트를 간단한 HTML로 변환 (줄바꿈만)
      finalResult = HtmlTextProcessor.plainTextToHtml(revisedText);
    } else {
      // 텍스트 그대로
      finalResult = revisedText;
    }

    // 응답 반환
    return {
      success: true,
      data: {
        originalText: text,
        revisedText: finalResult,
        preservedMedia: preserveMedia,
        mediaElements: processor?.getMediaElements() || [],
        type: type || 'text'
      }
    };

  } catch (error: any) {
    console.error('AI text revision error:', error);
    
    // Google AI API 에러 처리
    if (error.message?.includes('API key')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid API key'
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw createError({
        statusCode: 429,
        statusMessage: 'API quota exceeded. Please try again later.'
      });
    }
    
    // 기타 에러
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'AI text revision failed'
    });
  }
});