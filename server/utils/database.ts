/**
 * @description 데이터베이스 관련 공통 유틸리티
 * 기존 코드와 병행 실행을 위해 새로 생성된 유틸리티입니다.
 */
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

/**
 * Supabase 클라이언트 가져오기 (타입 안전)
 * @param event H3 이벤트 객체
 * @returns 타입이 지정된 Supabase 클라이언트
 */
export async function getSupabaseClient(event: any) {
  return await serverSupabaseClient<Database>(event);
}

/**
 * 게시글 존재 확인
 * @param supabase Supabase 클라이언트
 * @param postId 게시글 ID
 * @param includeDeleted 삭제된 게시글 포함 여부
 * @returns 게시글 데이터 또는 null
 */
export async function findPostById(
  supabase: any,
  postId: string,
  includeDeleted: boolean = false
) {
  let query = supabase
    .from("posts")
    .select("*")
    .eq("id", postId);

  if (!includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw error; // Other database errors
  }

  return data;
}

/**
 * 댓글 존재 확인
 * @param supabase Supabase 클라이언트
 * @param commentId 댓글 ID
 * @param includeDeleted 삭제된 댓글 포함 여부
 * @returns 댓글 데이터 또는 null
 */
export async function findCommentById(
  supabase: any,
  commentId: string,
  includeDeleted: boolean = false
) {
  let query = supabase
    .from("comments")
    .select("*")
    .eq("id", commentId);

  if (!includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw error; // Other database errors
  }

  return data;
}

/**
 * 게시글의 댓글 수 업데이트
 * @param supabase Supabase 클라이언트
 * @param postId 게시글 ID
 * @returns 업데이트된 댓글 수
 */
export async function updatePostCommentCount(
  supabase: any,
  postId: string
): Promise<number> {
  // 먼저 댓글 수 계산
  const { count, error: countError } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("is_deleted", false);

  if (countError) {
    throw countError;
  }

  const commentCount = count || 0;

  // 게시글의 comment_count 업데이트
  const { error: updateError } = await supabase
    .from("posts")
    .update({
      comment_count: commentCount,
      last_comment_at: commentCount > 0 ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  if (updateError) {
    throw updateError;
  }

  return commentCount;
}

/**
 * 댓글의 대댓글 수 업데이트
 * @param supabase Supabase 클라이언트
 * @param parentCommentId 부모 댓글 ID
 * @returns 업데이트된 대댓글 수
 */
export async function updateCommentReplyCount(
  supabase: any,
  parentCommentId: string
): Promise<number> {
  // 먼저 대댓글 수 계산
  const { count, error: countError } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", parentCommentId)
    .eq("is_deleted", false);

  if (countError) {
    throw countError;
  }

  const replyCount = count || 0;

  // 부모 댓글의 reply_count 업데이트
  const { error: updateError } = await supabase
    .from("comments")
    .update({ reply_count: replyCount })
    .eq("id", parentCommentId);

  if (updateError) {
    throw updateError;
  }

  return replyCount;
}

/**
 * 좋아요 수 증가/감소
 * @param supabase Supabase 클라이언트
 * @param table 테이블명 ('posts' | 'comments')
 * @param id 대상 ID
 * @param increment 증가/감소값 (1 또는 -1)
 * @returns 업데이트된 좋아요 수
 */
export async function updateLikeCount(
  supabase: any,
  table: 'posts' | 'comments',
  id: string,
  increment: number
): Promise<number> {
  // 현재 좋아요 수 조회
  const { data: currentData, error: fetchError } = await supabase
    .from(table)
    .select("like_count")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const currentCount = currentData.like_count || 0;
  const newCount = Math.max(0, currentCount + increment);

  // 좋아요 수 업데이트
  const updateData: any = {
    like_count: newCount,
  };

  // 게시글인 경우 updated_at도 업데이트
  if (table === 'posts') {
    updateData.updated_at = new Date().toISOString();
  }

  const { data: updatedData, error: updateError } = await supabase
    .from(table)
    .update(updateData)
    .eq("id", id)
    .select("like_count")
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedData.like_count;
}

/**
 * 조회수 증가
 * @param supabase Supabase 클라이언트
 * @param postId 게시글 ID
 * @returns 업데이트된 조회수
 */
export async function incrementViewCount(
  supabase: any,
  postId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('increment_view_count', {
    post_id: postId
  });

  if (error) {
    // RPC 함수가 없는 경우 일반적인 방법으로 처리
    const { data: currentData, error: fetchError } = await supabase
      .from("posts")
      .select("view_count")
      .eq("id", postId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const newCount = (currentData.view_count || 0) + 1;

    const { data: updatedData, error: updateError } = await supabase
      .from("posts")
      .update({ view_count: newCount })
      .eq("id", postId)
      .select("view_count")
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedData.view_count;
  }

  return data;
}

/**
 * 소프트 삭제
 * @param supabase Supabase 클라이언트
 * @param table 테이블명
 * @param id 대상 ID
 * @param softDeleteContent 삭제된 내용으로 교체할 텍스트
 * @returns 삭제 성공 여부
 */
export async function softDelete(
  supabase: any,
  table: 'posts' | 'comments',
  id: string,
  softDeleteContent?: string
): Promise<boolean> {
  const updateData: any = {
    is_deleted: true,
    deleted_at: new Date().toISOString(),
  };

  // 내용 교체 (선택적)
  if (softDeleteContent) {
    updateData.content = softDeleteContent;
  }

  const { error } = await supabase
    .from(table)
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * 트렌딩 게시글 조회
 * @param supabase Supabase 클라이언트
 * @param hours 시간 범위 (기본 24시간)
 * @param limit 개수 제한 (기본 20개)
 * @returns 트렌딩 게시글 ID 배열
 */
export async function getTrendingPostIds(
  supabase: any,
  hours: number = 24,
  limit: number = 20
): Promise<string[]> {
  const timeAgo = new Date();
  timeAgo.setHours(timeAgo.getHours() - hours);

  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .gte("created_at", timeAgo.toISOString())
    .eq("is_deleted", false)
    .order("view_count", { ascending: false })
    .order("like_count", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data?.map((post: any) => post.id) || [];
}

/**
 * 게시글 통계 조회
 * @param supabase Supabase 클라이언트
 * @returns 게시글 통계
 */
export async function getPostStats(supabase: any) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, view_count, like_count, comment_count, created_at")
    .eq("is_deleted", false);

  if (error) {
    throw error;
  }

  const stats = {
    totalPosts: data?.length || 0,
    totalViews: data?.reduce((sum: number, post: any) => sum + (post.view_count || 0), 0) || 0,
    totalLikes: data?.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0) || 0,
    totalComments: data?.reduce((sum: number, post: any) => sum + (post.comment_count || 0), 0) || 0,
  };

  return stats;
}

/**
 * 검색 쿼리 빌더
 * @param query 기본 쿼리 빌더
 * @param searchTerm 검색어
 * @param searchFields 검색 대상 필드들
 * @returns 검색 조건이 추가된 쿼리 빌더
 */
export function addSearchCondition(
  query: any,
  searchTerm: string,
  searchFields: string[] = ['title', 'plain_text']
): any {
  if (!searchTerm || !searchTerm.trim()) {
    return query;
  }

  const term = searchTerm.trim();
  const conditions = searchFields.map(field => `${field}.ilike.%${term}%`);
  
  return query.or(conditions.join(','));
}