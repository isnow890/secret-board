// server/api/comments/[commentId]/verify.post.ts
import { z } from "zod";
import bcrypt from "bcryptjs";
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { withApiKeyValidation } from "~/server/utils/apiKeyValidation";

const verifyPasswordSchema = z.object({
  password: z
    .string()
    .min(4, "비밀번호는 4자리이어야 합니다.")
    .max(100, "비밀번호가 너무 깁니다."),
});

export default withApiKeyValidation(async (event) => {
  try {
    // POST 메서드 확인
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "허용되지 않은 메서드입니다.",
      });
    }

    // 댓글 ID 가져오기
    const commentId = getRouterParam(event, "commentId");
    if (!commentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "댓글 ID가 필요합니다.",
      });
    }

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(commentId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "유효하지 않은 댓글 ID 형식입니다.",
      });
    }

    // 요청 본문 검증
    const body = await readBody(event);
    const validatedData = verifyPasswordSchema.parse(body);

    const supabase = await serverSupabaseClient<Database>(event);

    // 댓글 존재 확인
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("id, password_hash, is_deleted")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      throw createError({
        statusCode: 404,
        statusMessage: "댓글을 찾을 수 없습니다.",
      });
    }

    // 삭제된 댓글인지 확인
    if (comment.is_deleted) {
      throw createError({
        statusCode: 400,
        statusMessage: "삭제된 댓글은 수정할 수 없습니다.",
      });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(
      validatedData.password,
      comment.password_hash
    );

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: "비밀번호가 일치하지 않습니다.",
      });
    }

    return {
      success: true,
      message: "비밀번호가 확인되었습니다.",
    };
  } catch (error: any) {
    console.error("댓글 비밀번호 확인 API 오류:", error);

    // Zod 검증 오류
    if (error.name === "ZodError") {
      const firstError = error.errors[0];
      throw createError({
        statusCode: 400,
        statusMessage: firstError?.message || "입력값이 올바르지 않습니다.",
      });
    }

    // 이미 createError로 생성된 오류는 다시 던지기
    if (error.statusCode) {
      throw error;
    }

    // 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: "서버 오류가 발생했습니다.",
    });
  }
});
