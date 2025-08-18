/**
 * @description 게시글 작성 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 */
import { z } from "zod";
import { 
  createSuccessResponse,
  getSupabaseClient,
  hashPassword,
  createApiHandler,
  sanitizeHtml,
  stripHtml
} from '~/server/utils';

const createPostSchema = z.object({
  title: z
    .string()
    .min(3, "제목은 3자 이상이어야 합니다")
    .max(255, "제목은 255자 이하여야 합니다"),
  content: z
    .string()
    .min(10, "내용은 10자 이상이어야 합니다")
    .max(50000, "내용이 너무 깁니다"),
  nickname: z
    .string()
    .min(1, "닉네임을 입력해주세요")
    .max(15, "닉네임은 15자 이하여야 합니다")
    .regex(
      /^[가-힣a-zA-Z0-9\s]+$/,
      "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다"
    ),
  password: z
    .string()
    .length(4, "비밀번호는 4자리여야 합니다")
    .regex(/^[0-9]{4}$/, "비밀번호는 숫자만 입력 가능합니다"),
  attachedFiles: z
    .array(
      z.object({
        filename: z.string(),
        url: z.string(),
        size: z.number(),
      })
    )
    .optional()
    .default([]),
});

export default createApiHandler(async (event) => {
  // 1. 요청 본문 검증
  const body = await readBody(event);
  const { title, content, nickname, password, attachedFiles } = createPostSchema.parse(body);

  // 2. HTML 콘텐츠 정리
  const cleanContent = sanitizeHtml(content);

  // 3. 순수 텍스트 추출 (검색용)
  const plainText = stripHtml(cleanContent);

  // 4. 비밀번호 해싱
  const passwordHash = await hashPassword(password);

  // 5. 게시글 저장
  const supabase = await getSupabaseClient(event);
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      title: title.trim(),
      content: cleanContent,
      plain_text: plainText,
      nickname: nickname.trim(),
      password_hash: passwordHash,
      attached_files:
        attachedFiles && attachedFiles.length > 0 ? attachedFiles : null,
    })
    .select()
    .single();

  if (error) {
    console.error("Post creation error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "게시글 저장에 실패했습니다.",
    });
  }

  // 6. 백그라운드에서 AI 요약 생성 (non-awaitable)
  console.log(
    "🚀 [POST CREATE] Calling AI summary generation for post:",
    post.id
  );
  generateAiSummaryInBackground(post.id, title.trim(), cleanContent);

  // 7. 성공 응답
  return createSuccessResponse({
    id: post.id,
    title: post.title,
    created_at: post.created_at,
  }, "게시글이 작성되었습니다.");

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '게시글 작성 중 오류가 발생했습니다.'
});

// 백그라운드에서 AI 요약 생성하는 함수
async function generateAiSummaryInBackground(
  postId: string,
  title: string,
  content: string
) {
  console.log(
    `🤖 [AI Summary] Starting background generation for post ${postId}`
  );
  try {
    // GoogleGenAI를 직접 사용하여 요약 생성
    const { GoogleGenAI } = await import("@google/genai");
    const { tiptapUtils } = await import("~/utils/htmlTextProcessor");

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;

    if (!apiKey) {
      console.warn(
        "🤖 [AI Summary] Google AI Studio API key not configured, skipping AI summary"
      );
      return;
    }

    console.log(
      "🤖 [AI Summary] API key found, proceeding with text processing"
    );

    // HTML에서 순수 텍스트 추출
    const textToProcess = tiptapUtils.extractPlainText(content);
    console.log(
      `🤖 [AI Summary] Extracted text length: ${
        textToProcess.length
      }, content: ${textToProcess.substring(0, 100)}...`
    );

    // 100자 미만은 요약 생성 안함
    if (textToProcess.trim().length < 100) {
      console.log(
        `🤖 [AI Summary] Text too short (${
          textToProcess.trim().length
        } chars), skipping AI summary`
      );
      return;
    }

    // AI 요약 생성
    console.log("🤖 [AI Summary] Initializing GoogleGenAI...");
    const ai = new GoogleGenAI({ apiKey });
    console.log("🤖 [AI Summary] GoogleGenAI initialized successfully");

    const systemPrompt = `당신은 게시글을 간결하게 요약하는 전문가입니다.

핵심 원칙:
1. 게시글의 주요 내용과 핵심 메시지를 파악하여 간결하게 요약하세요
2. 2-3문장으로 핵심 내용만 전달하세요 
3. 개인정보나 민감한 정보는 제외하세요
4. 객관적이고 중립적인 어조로 작성하세요
5. 게시글의 주제와 논점을 명확히 드러내세요
6. 불필요한 수식어나 감정 표현은 제거하세요

요약 길이: 50-150자 내외
어조: 객관적, 간결함`;

    const userPrompt = `다음 게시글을 위의 원칙에 따라 간결하게 요약해주세요:

제목: ${title}

내용: ${textToProcess}`;

    console.log("🤖 [AI Summary] Calling GoogleGenAI API...");
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
        temperature: 0.3,
        maxOutputTokens: 8192,
        candidateCount: 1,
      },
    });

    console.log("🤖 [AI Summary] API call completed, processing response...");
    console.log("🤖 [AI Summary] Response structure:", {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      hasText: !!(response as any).text,
      responseKeys: Object.keys(response || {}),
      firstCandidate: response.candidates?.[0]
    });
    
    let summary = null;
    
    try {
      // 최신 Google GenAI API 응답 구조 확인 (실제 응답 구조 기반)
      if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        summary = response.candidates[0].content.parts[0].text;
        console.log("🤖 [AI Summary] Extracted from candidates.content.parts[0].text");
      }
      // 직접 text 속성 확인
      else if ((response as any).text) {
        summary = (response as any).text;
        console.log("🤖 [AI Summary] Extracted from response.text");
      }
      
      if (summary) {
        summary = summary.trim();
        console.log("🤖 [AI Summary] Final summary extracted:", summary.substring(0, 100) + "...");
      } else {
        console.log("🤖 [AI Summary] No summary found in any expected location");
        console.log("🤖 [AI Summary] Full response:", JSON.stringify(response, null, 2));
      }
    } catch (parseError) {
      console.error("🚨 [AI Summary] Error parsing response:", parseError);
      console.log("🤖 [AI Summary] Full response on error:", JSON.stringify(response, null, 2));
    }
    
    console.log(`🤖 [AI Summary] Generated summary: ${summary?.substring(0, 100)}...`);

    if (summary) {
      // DB에 요약 저장 (백그라운드 실행이므로 createClient 사용)
      const { createClient } = await import("@supabase/supabase-js");

      // 백그라운드에서는 환경 변수를 직접 사용
      const supabaseUrl =
        process.env.SUPABASE_URL || process.env.NUXT_SUPABASE_URL;
      const supabaseServiceKey =
        process.env.SUPABASE_SERVICE_KEY ||
        process.env.NUXT_SUPABASE_SERVICE_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("🚨 [AI Summary] Missing Supabase credentials:", {
          url: !!supabaseUrl,
          serviceKey: !!supabaseServiceKey,
        });
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from("posts")
        .update({
          ai_summary:
            summary.length > 200 ? summary.substring(0, 197) + "..." : summary,
          summary_generated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (updateError) {
        console.error("AI summary update error:", updateError);
      } else {
        console.log(
          `AI summary generated for post ${postId}: ${summary.substring(
            0,
            50
          )}...`
        );
      }
    }
  } catch (error: any) {
    // 에러가 발생해도 로그만 남기고 무시 (graceful degradation)
    console.error("🚨 [AI Summary] Background generation error:", error);
    console.error("🚨 [AI Summary] Error stack:", error.stack);
    console.error("🚨 [AI Summary] Error message:", error.message);
    console.error("🚨 [AI Summary] Error details:", {
      name: error.name,
      code: error.code,
      status: error.status,
      statusText: error.statusText,
    });
  }
}
