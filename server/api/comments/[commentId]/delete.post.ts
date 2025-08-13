// server/api/comments/[commentId]/delete.post.ts
import bcrypt from "bcryptjs";
import { z } from "zod";
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

const DeleteCommentSchema = z.object({
  password: z.string().min(1),
});

export default withApiKeyValidation(async (event) => {
  try {
    // POST 요청만 허용 (DELETE 메서드 대신 POST 사용)
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed",
      });
    }

    // URL에서 commentId 추출
    const commentId = getRouterParam(event, "commentId");
    if (!commentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Comment ID is required",
      });
    }

    const body = await readBody(event);

    // 유효성 검사
    const validation = DeleteCommentSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Password is required",
        data: validation.error.issues,
      });
    }

    const { password } = validation.data;

    // Supabase 클라이언트
    const supabase = await serverSupabaseClient<Database>(event);

    // 댓글 조회 및 비밀번호 확인 (삭제되지 않은 댓글만)
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("id, password_hash, depth, parent_id, post_id, is_deleted")
      .eq("id", commentId)
      .eq("is_deleted", false)
      .single();

    if (fetchError || !comment) {
      throw createError({
        statusCode: 404,
        statusMessage: "댓글을 찾을 수 없습니다.",
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, comment.password_hash);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "비밀번호가 일치하지 않습니다.",
      });
    }

    // 항상 Soft Delete 처리
    const { error: updateError } = await supabase
      .from("comments")
      .update({
        content: "삭제된 댓글입니다.",
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (updateError) {
      console.error("Comment soft delete error:", updateError);
      throw createError({
        statusCode: 500,
        statusMessage: "댓글 삭제 중 오류가 발생했습니다.",
      });
    }

    return {
      success: true,
      data: {
        deleted: true,
        soft_deleted: true,
        comment_id: commentId,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Comment deletion error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "댓글 삭제 중 오류가 발생했습니다.",
    });
  }
});