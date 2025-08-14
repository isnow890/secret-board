/**
 * @description 게시글 목록을 조회하는 API 엔드포인트입니다.
 * 페이지네이션(페이지 기반, 커서 기반), 정렬, 검색 기능을 지원합니다.
 * @see /api/posts
 * @method GET
 * @param {object} event - H3 이벤트 객체
 * @returns {Promise<object>} 게시글 목록과 페이지네이션 정보를 포함하는 응답 객체
 */
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { stripHtml } from "~/server/utils";
import { logApiCall, logError } from "~/utils/logger";

export default defineEventHandler(async (event) => {
  const startTime = Date.now();

  try {
    const query = getQuery(event);
    const { cursor, page, limit = 20, sort = "created", search = "" } = query;

    const pageLimit = Math.min(Number(limit), 50); // 최대 50개
    const currentPage = page ? Math.max(1, Number(page)) : 1;
    const offset = (currentPage - 1) * pageLimit;

    const supabase = await serverSupabaseClient<Database>(event);

    // 총 개수 조회를 위한 쿼리 (검색 조건 포함) - 삭제되지 않은 게시글만
    let countQueryBuilder = supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      // 삭제되지 않은 게시글만 카운트
      .eq("is_deleted", false);

    let queryBuilder = supabase
      .from("posts")
      // 실제 존재하는 컬럼만 선택, is_deleted도 포함
      .select(
        "id, title, nickname, content, attached_files, view_count, like_count, comment_count, created_at, last_comment_at, is_deleted"
      )
      // 삭제되지 않은 게시글만 조회
      .eq("is_deleted", false);

    // 검색 조건 추가 (메인 쿼리와 카운트 쿼리 모두에 적용)
    if (search && typeof search === "string" && search.trim()) {
      const searchTerm = search.trim();
      // preview 컬럼이 없으므로 title/plain_text 기준으로 검색
      queryBuilder = queryBuilder.or(
        `title.ilike.%${searchTerm}%,plain_text.ilike.%${searchTerm}%`
      );
      countQueryBuilder = countQueryBuilder.or(
        `title.ilike.%${searchTerm}%,plain_text.ilike.%${searchTerm}%`
      );
    }

    // 정렬 적용
    const sortType = Array.isArray(sort) ? sort[0] : sort;
    switch (sortType) {
      case "created":
        queryBuilder = queryBuilder
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
        break;
      case "activity":
        queryBuilder = queryBuilder
          .order("last_comment_at", { ascending: false })
          .order("id", { ascending: false });
        break;
      case "likes":
        queryBuilder = queryBuilder
          .order("like_count", { ascending: false })
          .order("id", { ascending: false });
        break;
      case "views":
        queryBuilder = queryBuilder
          .order("view_count", { ascending: false })
          .order("id", { ascending: false });
        break;
      case "comments":
        queryBuilder = queryBuilder
          .order("comment_count", { ascending: false })
          .order("id", { ascending: false });
        break;
      default:
        queryBuilder = queryBuilder
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
    }

    // 페이지 기반 또는 커서 기반 페이지네이션
    if (page) {
      // 페이지 기반 페이지네이션
      queryBuilder = queryBuilder.range(offset, offset + pageLimit - 1);
    } else if (cursor && typeof cursor === "string") {
      // 커서 기반 페이지네이션 (기존 로직)
      switch (sortType) {
        case "created":
          const [createdAt, id] = cursor.split("|");
          if (createdAt && id) {
            queryBuilder = queryBuilder.or(
              `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`
            );
          }
          break;
        case "activity":
          const [lastCommentAt, activityId] = cursor.split("|");
          if (lastCommentAt && activityId) {
            queryBuilder = queryBuilder.or(
              `last_comment_at.lt.${lastCommentAt},and(last_comment_at.eq.${lastCommentAt},id.lt.${activityId})`
            );
          }
          break;
        case "likes":
          const [likeCount, likeId] = cursor.split("|");
          if (likeCount && likeId) {
            queryBuilder = queryBuilder.or(
              `like_count.lt.${likeCount},and(like_count.eq.${likeCount},id.lt.${likeId})`
            );
          }
          break;
        case "views":
          const [viewCount, viewId] = cursor.split("|");
          if (viewCount && viewId) {
            queryBuilder = queryBuilder.or(
              `view_count.lt.${viewCount},and(view_count.eq.${viewCount},id.lt.${viewId})`
            );
          }
          break;
        case "comments":
          const [commentCount, commentId] = cursor.split("|");
          if (commentCount && commentId) {
            queryBuilder = queryBuilder.or(
              `comment_count.lt.${commentCount},and(comment_count.eq.${commentCount},id.lt.${commentId})`
            );
          }
          break;
      }
      queryBuilder = queryBuilder.limit(pageLimit + 1);
    } else {
      // 기본: 첫 페이지
      queryBuilder = queryBuilder.limit(pageLimit + 1);
    }

    // 총 개수 조회
    const { count: totalCount, error: countError } = await countQueryBuilder;

    if (countError) {
      console.error("Count fetch error:", countError);
    }

    const { data: posts, error } = await queryBuilder;

    if (error) {
      console.error("Posts fetch error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "게시글 목록 조회에 실패했습니다.",
      });
    }

    let hasMore = false;
    let returnPosts = posts;
    let nextCursor = null;

    if (page) {
      // 페이지 기반 페이지네이션
      hasMore = currentPage * pageLimit < (totalCount || 0);
      returnPosts = posts; // range()로 정확히 가져왔으므로 그대로 사용
    } else {
      // 커서 기반 페이지네이션
      hasMore = posts.length > pageLimit;
      returnPosts = hasMore ? posts.slice(0, pageLimit) : posts;

      // 다음 커서 생성
      if (hasMore && returnPosts.length > 0) {
        const lastPost = returnPosts[returnPosts.length - 1];
        switch (sortType) {
          case "created":
            nextCursor = `${lastPost?.created_at}|${lastPost?.id}`;
            break;
          case "activity":
            nextCursor = `${lastPost?.last_comment_at}|${lastPost?.id}`;
            break;
          case "likes":
            nextCursor = `${lastPost?.like_count}|${lastPost?.id}`;
            break;
          case "views":
            nextCursor = `${lastPost?.view_count}|${lastPost?.id}`;
            break;
          case "comments":
            nextCursor = `${lastPost?.comment_count}|${lastPost?.id}`;
            break;
          default:
            nextCursor = `${lastPost?.created_at}|${lastPost?.id}`;
        }
      }
    }

    // 메타데이터는 이미 데이터베이스에서 관리됨
    const postsWithPreview = returnPosts.map((post: any) => {
      // preview 텍스트 계산 (content HTML 제거 후 앞부분 슬라이스)
      const text =
        typeof post.content === "string" ? stripHtml(post.content) : "";
      const preview = text.slice(0, 140);

      // 첨부파일 메타 계산 (attached_files는 JSON 배열일 수 있음)
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

    const totalPages = Math.ceil((totalCount || 0) / pageLimit);

    const response = {
      success: true,
      data: {
        posts: postsWithPreview,
        pagination: {
          // 페이지 기반 정보
          currentPage: page ? currentPage : null,
          totalPages: page ? totalPages : null,
          totalCount: totalCount || 0,
          hasMore,
          // 커서 기반 정보 (호환성 유지)
          nextCursor,
          currentSort: sortType,
          searchQuery: search || null,
        },
      },
      timestamp: new Date().toISOString(),
    };

    // 성공 로깅
    const responseTime = Date.now() - startTime;
    logApiCall("GET", "/api/posts", responseTime, 200);

    // UTF-8 인코딩 명시적 설정
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8');

    return response;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    console.error("Posts list error:", error);

    // 에러 로깅
    logError(error, {
      method: "GET",
      endpoint: "/api/posts",
      responseTime,
      query: getQuery(event),
    });

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "서버 오류가 발생했습니다.",
    });
  }
});
