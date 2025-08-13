// server/api/posts/[id]/edit.post.ts
import bcrypt from "bcryptjs";
import { z } from "zod";
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { withApiKeyValidation } from "~/server/utils/apiKeyValidation";

const editPostSchema = z.object({
  title: z
    .string()
    .min(5, "제목은 5자 이상이어야 합니다")
    .max(255, "제목은 255자 이하여야 합니다"),
  content: z
    .string()
    .min(10, "내용은 10자 이상이어야 합니다")
    .max(50000, "내용이 너무 깁니다"),
  password: z
    .string()
    .min(4, "비밀번호는 4자 이상이어야 합니다")
    .max(20, "비밀번호는 20자 이하여야 합니다"),
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

export default withApiKeyValidation(async (event) => {
  try {
    // POST 요청만 허용
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed",
      });
    }

    // URL에서 postId 추출
    const postId = getRouterParam(event, "id");
    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Post ID is required",
      });
    }

    const body = await readBody(event);

    // 유효성 검사
    const validation = editPostSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request data",
        data: validation.error.issues,
      });
    }

    const { title, content, password, attachedFiles } = validation.data;

    // Supabase 클라이언트
    const supabase = await serverSupabaseClient<Database>(event);

    // 게시글 조회 및 비밀번호 확인 (기존 첨부파일 정보 포함)
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, password_hash, attached_files")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw createError({
        statusCode: 404,
        statusMessage: "게시글을 찾을 수 없습니다.",
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, post.password_hash);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "비밀번호가 일치하지 않습니다.",
      });
    }

    // HTML 콘텐츠 정리
    const cleanContent = sanitizeHtml(content);

    // 기존 첨부파일과 새로운 첨부파일 비교해서 삭제된 파일들 찾기
    const existingFiles = (post as any)?.attached_files || [];
    const newFiles = attachedFiles || [];

    // 기존 파일 중에서 새로운 파일 목록에 없는 것들 = 삭제된 파일들
    const filesToDelete = existingFiles.filter(
      (existingFile: any) =>
        !newFiles.some((newFile: any) => newFile.url === existingFile.url)
    );

    // Storage에서 삭제된 파일들 제거
    if (filesToDelete.length > 0) {
      console.log(
        "Deleting files from storage:",
        filesToDelete.map((f: any) => f.filename)
      );

      for (const fileToDelete of filesToDelete) {
        try {
          // URL에서 파일 경로 추출 (예: https://...supabase.co/storage/v1/object/public/attachments/2024/01/15/file.pdf)
          const urlParts = fileToDelete.url.split(
            "/storage/v1/object/public/attachments/"
          );
          if (urlParts.length > 1) {
            const filePath = urlParts[1];

            const { error: deleteError } = await supabase.storage
              .from("attachments")
              .remove([filePath]);

            if (deleteError) {
              console.error(
                `Failed to delete file from storage: ${filePath}`,
                deleteError
              );
              // Storage 삭제 실패는 치명적이지 않으므로 계속 진행
            } else {
              console.log(
                `Successfully deleted file from storage: ${filePath}`
              );
            }
          }
        } catch (deleteErr) {
          console.error("Error deleting file from storage:", deleteErr);
          // Storage 삭제 실패는 치명적이지 않으므로 계속 진행
        }
      }
    }

    // 게시글 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        content: cleanContent,
        attached_files:
          attachedFiles && attachedFiles.length > 0 ? attachedFiles : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (updateError) {
      console.error("Post update error:", updateError);
      throw createError({
        statusCode: 500,
        statusMessage: "게시글 수정에 실패했습니다.",
      });
    }

    // 백그라운드에서 AI 요약 재생성 (non-awaitable)
    generateAiSummaryInBackground(updatedPost.id, title.trim(), cleanContent);

    return {
      success: true,
      data: {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        updated_at: updatedPost.updated_at,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Post edit error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "게시글 수정 중 오류가 발생했습니다.",
    });
  }
});

// 간단한 HTML 정리 함수 (서버사이드)
function sanitizeHtml(html: string): string {
  // 허용된 태그만 남기고 나머지 제거 (향후 확장 예정)
  // const allowedTags = [
  //   "p", "br", "strong", "em", "u", "s", "strike",
  //   "ul", "ol", "li", "blockquote", "code", "pre",
  //   "h1", "h2", "h3", "h4", "h5", "h6", "a", "img"
  // ];

  // const allowedAttributes = ["href", "src", "alt", "title", "class"];

  // 간단한 HTML 정리 (실제 운영에서는 DOMPurify 사용 권장)
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
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  cleaned = cleaned.replace(/javascript:/gi, "");

  return cleaned.trim();
}

// 백그라운드에서 AI 요약 생성하는 함수
async function generateAiSummaryInBackground(
  postId: string,
  title: string,
  content: string
) {
  try {
    // GoogleGenAI를 직접 사용하여 요약 생성
    const { GoogleGenAI } = await import("@google/genai");
    const { tiptapUtils } = await import("~/utils/htmlTextProcessor");

    const config = useRuntimeConfig();
    const apiKey = config.googleAiStudioApiKey;

    if (!apiKey) {
      console.warn(
        "Google AI Studio API key not configured, skipping AI summary"
      );
      return;
    }

    // HTML에서 순수 텍스트 추출
    const textToProcess = tiptapUtils.extractPlainText(content);

    // 100자 미만은 요약 생성 안함
    if (textToProcess.trim().length < 100) {
      return;
    }

    // AI 요약 생성
    const ai = new GoogleGenAI({ apiKey });

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
        maxOutputTokens: 200,
        candidateCount: 1,
      },
    });

    const summary = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (summary) {
      // DB에 요약 저장 (백그라운드 실행이므로 createClient 사용)
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NUXT_SUPABASE_SERVICE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase credentials not configured");
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
          `AI summary updated for post ${postId}: ${summary.substring(
            0,
            50
          )}...`
        );
      }
    }
  } catch (error) {
    // 에러가 발생해도 로그만 남기고 무시 (graceful degradation)
    console.error("Background AI summary generation error:", error);
  }
}
