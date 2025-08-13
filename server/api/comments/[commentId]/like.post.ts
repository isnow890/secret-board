// server/api/comments/[commentId]/like.post.ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

export default withApiKeyValidation(async (event) => {
  try {
    // POST 요청만 허용
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed",
      });
    }

    const commentId = getRouterParam(event, "commentId");
    const body = await readBody(event);

    if (!commentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Comment ID is required",
      });
    }

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(commentId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid comment ID format",
      });
    }

    // liked 상태 확인 (true: 좋아요 추가, false: 좋아요 제거)
    const isLiked = body?.liked === true;

    // Supabase 클라이언트
    const supabase = await serverSupabaseClient<Database>(event);

    // 댓글 존재 확인
    const { data: comment } = await supabase
      .from("comments")
      .select("id, like_count")
      .eq("id", commentId)
      .single();

    if (!comment) {
      throw createError({
        statusCode: 404,
        statusMessage: "Comment not found",
      });
    }

    // 좋아요 수 증가/감소
    const currentCount = comment.like_count || 0;
    const newCount = isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    const { data: updatedComment, error } = await supabase
      .from("comments")
      .update({
        like_count: newCount,
      })
      .eq("id", commentId)
      .select("id, like_count")
      .single();

    if (error) {
      console.error("댓글 좋아요 에러:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to update comment like",
      });
    }

    return {
      success: true,
      data: {
        id: updatedComment.id,
        like_count: updatedComment.like_count,
        liked: isLiked,
      },
    };
  } catch (error: any) {
    console.error("댓글 좋아요 API 에러:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
