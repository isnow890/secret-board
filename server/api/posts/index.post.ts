// server/api/posts/index.post.ts
import bcrypt from "bcryptjs";
import { z } from "zod";
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from '~/types/supabase';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

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
    .regex(/^[가-힣a-zA-Z0-9\s]+$/, "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다"),
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

export default withApiKeyValidation(async (event) => {
  try {
    const body = await readBody(event);
    const { title, content, nickname, password, attachedFiles } =
      createPostSchema.parse(body);

    // HTML 콘텐츠 정리 (DOMPurify 서버사이드 대체)
    const cleanContent = sanitizeHtml(content);

    // 순수 텍스트 추출 (검색용)
    const plainText = cleanContent.replace(/<[^>]*>/g, "").trim();

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // 게시글 저장
    const supabase = await serverSupabaseClient<Database>(event);
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title: title.trim(),
        content: cleanContent,
        plain_text: plainText,
        nickname: nickname.trim(),
        password_hash: passwordHash,
        attached_files: attachedFiles && attachedFiles.length > 0 ? attachedFiles : null,
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

    return {
      success: true,
      data: {
        id: post.id,
        title: post.title,
        created_at: post.created_at,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Post creation error:", error);

    if (error.issues) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0].message,
      });
    }

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "서버 오류가 발생했습니다.",
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
  cleaned = cleaned.replace(
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ""
  );

  // on* 이벤트 속성 제거
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // javascript: URL 제거
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, "");

  return cleaned;
}
