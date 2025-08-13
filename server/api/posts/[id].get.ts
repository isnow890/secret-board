// server/api/posts/[id].get.ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { stripHtml } from "~/server/utils/textUtils";

export default defineEventHandler(async (event) => {
  try {
    const postId = getRouterParam(event, "id");

    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: "게시글 ID가 필요합니다.",
      });
    }

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "올바르지 않은 게시글 ID입니다.",
      });
    }

    const supabase = await serverSupabaseClient<Database>(event);

    // 게시글 조회 (삭제된 게시글 제외)
    const { data: post, error } = await supabase
      .from("posts")
      // 실제 존재하는 컬럼만 선택, is_deleted도 포함
      .select(
        `
        id,
        title,
        nickname,
        content,
        attached_files,
        view_count,
        like_count,
        comment_count,
        created_at,
        updated_at,
        last_comment_at,
        is_deleted
      `
      )
      .eq("id", postId)
      .eq("is_deleted", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        throw createError({
          statusCode: 404,
          statusMessage: "게시글을 찾을 수 없습니다.",
        });
      }

      console.error("Post fetch error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "게시글 조회에 실패했습니다.",
      });
    }

    // 파생 필드 계산 (preview/첨부 메타)
    const text =
      typeof post?.content === "string" ? stripHtml(post.content) : "";
    const preview = text.slice(0, 200);
    const files = Array.isArray((post as any)?.attached_files)
      ? (post as any).attached_files
      : [];
    const hasAttachments = files.length > 0;
    const attachmentCount = files.length;

    // 보안상 비밀번호 해시는 제외, 필요한 필드 병합
    const postWithMeta = post
      ? {
          id: post.id,
          title: post.title,
          nickname: (post as any).nickname,
          content: post.content,
          view_count: post.view_count,
          like_count: post.like_count,
          comment_count: post.comment_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          last_comment_at: post.last_comment_at,
          attached_files: (post as any).attached_files ?? [],
          is_deleted: (post as any).is_deleted || false,
          preview,
          hasAttachments,
          attachmentCount,
        }
      : null;

    return {
      success: true,
      data: postWithMeta,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Post detail error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "서버 오류가 발생했습니다.",
    });
  }
});
