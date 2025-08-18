/**
 * @description 특정 ID의 단일 게시글 상세 정보를 조회하는 API 엔드포인트입니다.
 * 삭제된 게시글도 접근 가능하며, 파생 필드(미리보기, 첨부파일 메타데이터)를 계산하여 반환합니다.
 * @see /api/posts/:id
 * @method GET
 * @param {object} event - H3 이벤트 객체
 * @returns {Promise<object>} 게시글 상세 정보를 포함하는 응답 객체
 * @throws {400} 게시글 ID가 없거나 형식이 올바르지 않은 경우
 * @throws {404} 해당 ID의 게시글을 찾을 수 없는 경우
 * @throws {500} 서버 오류 발생 시
 */
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { stripHtml } from "~/server/utils";

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

    // 게시글 조회 (삭제된 게시글도 포함 - 인기글에서 접근 가능)
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
        is_deleted,
        ai_summary,
        summary_generated_at
      `
      )
      .eq("id", postId)
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
    const files = Array.isArray(post?.attached_files)
      ? post.attached_files
      : [];
    const hasAttachments = files.length > 0;
    const attachmentCount = files.length;

    // 보안상 비밀번호 해시는 제외, 필요한 필드 병합
    const postWithMeta = post
      ? {
          id: post.id,
          title: post.title,
          nickname: post.nickname,
          content: post.content,
          view_count: post.view_count,
          like_count: post.like_count,
          comment_count: post.comment_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          last_comment_at: post.last_comment_at,
          attached_files: post.attached_files ?? [],
          is_deleted: post.is_deleted || false,
          ai_summary: post.ai_summary || null,
          summary_generated_at: post.summary_generated_at || null,
          preview,
          hasAttachments,
          attachmentCount,
        }
      : null;

    // UTF-8 인코딩 명시적 설정
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8');

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
