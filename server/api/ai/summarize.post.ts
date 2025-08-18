// server/api/ai/summarize.post.ts
import { GoogleGenAI } from "@google/genai";
import { HtmlTextProcessor, tiptapUtils } from "~/utils/htmlTextProcessor";

export default defineEventHandler(async (event) => {
  try {
    // API 키 확인
    const config = useRuntimeConfig();
    const apiKey = config.googleAiStudioApiKey;

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: "Google AI Studio API key is not configured",
      });
    }

    // 요청 본문 파싱
    const body = await readBody(event);
    const { text, type = "text" } = body;

    // 입력 검증
    if (!text || typeof text !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Text is required and must be a string",
      });
    }

    if (text.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Text cannot be empty",
      });
    }

    if (text.length > 50000) {
      throw createError({
        statusCode: 400,
        statusMessage: "Text is too long (max 50000 characters)",
      });
    }

    // 텍스트 전처리 - 순수 텍스트만 추출
    let textToProcess: string;
    if (type === "html") {
      textToProcess = tiptapUtils.extractPlainText(text);
    } else {
      textToProcess = text;
    }

    if (textToProcess.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No text content found to process",
      });
    }

    // 100자 미만은 요약 제공 안함
    if (textToProcess.trim().length < 100) {
      return {
        success: false,
        error:
          "Content too short for summary (minimum 100 characters required)",
        data: {
          textLength: textToProcess.trim().length,
          minimumLength: 100,
        },
      };
    }

    // Google Gemini AI 초기화
    const ai = new GoogleGenAI({ apiKey });

    // 요약 생성 프롬프트
    const systemPrompt = `당신은 게시글을 간결하게 요약하는 전문가입니다.

핵심 원칙:
1. 게시글의 주요 내용과 핵심 메시지를 파악하여 간결하게 요약하세요
2. 2-3문장으로 핵심 내용만 전달하세요 
3. 개인정보나 민감한 정보는 제외하세요
4. 객관적이고 중립적인 어조로 작성하세요
5. 게시글의 주제와 논점을 명확히 드러내세요
6. 불필요한 수식어나 감정 표현은 제거하세요

요약 길이: 50-150자 내외
어조: 객관적, 간결함

예시:
입력: "오늘 회사에서 새로운 프로젝트 발표가 있었는데요. 정말 혁신적인 아이디어라고 생각해요! AI를 활용한 업무 자동화 시스템인데, 기존보다 효율성이 30% 향상될 것 같습니다. 다만 도입 과정에서 직원들의 적응이 필요할 것 같아요..."
출력: "회사에서 AI 활용 업무 자동화 시스템 프로젝트가 발표되었으며, 30% 효율성 향상이 예상되지만 직원 적응 과정이 필요합니다."`;

    const userPrompt = `다음 게시글을 위의 원칙에 따라 간결하게 요약해주세요:

${textToProcess}`;

    // Gemini API 호출
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.3, // 일관성 있는 결과
        maxOutputTokens: 200, // 짧은 요약을 위해
        candidateCount: 1,
      },
    });

    let summary = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to generate summary",
      });
    }

    summary = summary.trim();

    // 요약문 길이 검증 (너무 길면 잘라내기)
    if (summary.length > 200) {
      summary = summary.substring(0, 197) + "...";
    }

    // 응답 반환
    return {
      success: true,
      data: {
        originalText: text,
        originalLength: textToProcess.length,
        summary: summary,
        summaryLength: summary.length,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("AI summary generation error:", error);

    // Google AI API 에러 처리
    if (error.message?.includes("API key")) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid API key",
      });
    }

    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      throw createError({
        statusCode: 429,
        statusMessage: "API quota exceeded. Please try again later.",
      });
    }

    // 기타 에러
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "AI summary generation failed",
    });
  }
});
