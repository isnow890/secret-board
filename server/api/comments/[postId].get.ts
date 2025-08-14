/**
 * @description 특정 게시글의 댓글 목록을 조회하는 API 엔드포인트입니다.
 * 댓글은 계층 구조로 변환되어 반환되며, 삭제된 댓글도 포함됩니다.
 * @see /api/comments/:postId
 * @method GET
 * @param {object} event - H3 이벤트 객체
 * @returns {Promise<object>} 댓글 목록과 총 개수를 포함하는 응답 객체
 * @throws {400} 게시글 ID가 없거나 형식이 올바르지 않은 경우
 * @throws {404} 해당 게시글을 찾을 수 없는 경우
 * @throws {500} 서버 오류 발생 시
 */
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  try {
    const postId = getRouterParam(event, "postId");

    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Post ID is required",
      });
    }

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid post ID format",
      });
    }

    // Supabase 클라이언트
    const supabase = await serverSupabaseClient<Database>(event);

    // 게시글 존재 확인 (삭제된 게시글도 포함)
    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: "Post not found",
      });
    }

    // 댓글 조회 (삭제된 댓글 포함 - 시간순으로 가져온 후 계층구조에서 정렬)
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
    nickname,
        depth,
        like_count,
        reply_count,
        is_author,
        is_deleted,
        created_at,
        updated_at,
        parent_id
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("댓글 조회 에러:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch comments",
      });
    }

    // 댓글을 계층구조로 변환
    const commentMap = new Map();
    const rootComments: any[] = [];

    // 먼저 모든 댓글을 Map에 저장하고 replies 배열 초기화
    comments?.forEach((comment: any) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    });

    // 계층구조 구성
    comments?.forEach((comment: any) => {
      const commentWithReplies = commentMap.get(comment.id);

      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    // 루트 댓글들을 최신순으로 정렬 (최신 댓글이 위에 오도록)
    rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 각 댓글의 대댓글들도 시간순으로 정렬 (오래된 것부터 - 대화 흐름 유지)
    const sortReplies = (comments: any[]) => {
      comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          sortReplies(comment.replies);
        }
      });
    };

    sortReplies(rootComments);

    return {
      success: true,
      data: rootComments,
      meta: {
        total: comments?.length || 0,
      },
    };
  } catch (error: any) {
    console.error("댓글 조회 API 에러:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
