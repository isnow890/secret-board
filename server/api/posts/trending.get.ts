// server/api/posts/trending.get.ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { stripHtml } from "~/server/utils/textUtils";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = Math.min(parseInt(query.limit as string) || 5, 20);

    const supabase = await serverSupabaseClient<Database>(event);

    // 최근 24시간 내에 생성된 게시글 중 조회수가 높은 순으로 정렬
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: posts, error } = await supabase
      .from("posts")
      // 실제 존재하는 컬럼만 선택
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
        last_comment_at
      `
      )
      .gte("created_at", twentyFourHoursAgo.toISOString())
      .order("view_count", { ascending: false })
      .order("like_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("인기글 조회 실패:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "인기글을 불러오는데 실패했습니다.",
      });
    }

    // preview/첨부 메타 계산
    const postsWithPreview = (posts || []).map((post: any) => {
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

    return {
      success: true,
      data: {
        posts: postsWithPreview,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("인기글 API 오류:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "서버 오류가 발생했습니다.",
    });
  }
});
