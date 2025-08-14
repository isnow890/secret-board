/**
 * @description 인기 게시글 목록을 조회하는 API 엔드포인트입니다.
 * 최근 24시간 이내에 작성된 게시글 중 조회수와 좋아요 수를 기준으로 정렬하여 반환합니다.
 * @see /api/posts/trending
 * @method GET
 * @param {object} event - H3 이벤트 객체
 * @returns {Promise<object>} 인기 게시글 목록과 페이지네이션 정보를 포함하는 응답 객체
 * @throws {500} 서버 오류 발생 시
 */
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { stripHtml } from "~/server/utils";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = Math.min(Number(query.limit || 5), 20); // 최대 20개

    const supabase = await serverSupabaseClient<Database>(event);

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        "id, title, nickname, content, attached_files, view_count, like_count, comment_count, created_at, last_comment_at, is_deleted"
      )
      .eq("is_deleted", false) // 삭제되지 않은 게시글만
      .gte("created_at", twentyFourHoursAgo.toISOString()) // 최근 24시간 이내
      .order("view_count", { ascending: false }) // 조회수 내림차순
      .order("like_count", { ascending: false }) // 좋아요 수 내림차순
      .limit(limit);

    if (error) {
      console.error("Trending posts fetch error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "인기 게시글 조회에 실패했습니다.",
      });
    }

    const postsWithPreview = posts.map((post: any) => {
      const text =
        typeof post.content === "string" ? stripHtml(post.content) : "";
      const preview = text.slice(0, 140);
      const files = Array.isArray(post.attached_files)
        ? post.attached_files
        : [];
      const hasAttachments = files.length > 0;
      const attachmentCount = files.length;

      return {
        ...post,
        preview,
        hasAttachments,
        attachmentCount,
      };
    });

    // UTF-8 인코딩 명시적 설정
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8');

    return {
      success: true,
      data: {
        posts: postsWithPreview,
        pagination: {
          totalCount: posts.length,
          hasMore: false, // 인기글은 페이지네이션 없음
        },
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Trending posts error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "서버 오류가 발생했습니다.",
    });
  }
});
