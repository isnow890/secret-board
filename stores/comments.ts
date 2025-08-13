/**
 * 댓글 관련 상태를 관리하는 Pinia 스토어
 * 
 * 기능:
 * - 게시글별 댓글 수 실시간 추적
 * - 댓글 생성/삭제 시 자동 카운트 업데이트
 * - 전역 댓글 상태 관리
 * 
 * 용도: 게시글 목록에서 댓글 수를 실시간으로 표시하기 위해 사용
 */

import { defineStore } from "pinia";
import { readonly, ref } from "vue";

export const useCommentsStore = defineStore("comments", () => {
  // === 상태 관리 ===
  
  /** 게시글 ID별 댓글 수를 저장하는 맵 */
  const commentCounts = ref<Record<string, number>>({});

  // === 액션 메서드 ===
  
  /**
   * 특정 게시글의 댓글 수를 설정
   * @param postId 게시글 ID
   * @param count 설정할 댓글 수
   */
  const updateCommentCount = (postId: string, count: number) => {
    commentCounts.value[postId] = count;
  };

  /**
   * 특정 게시글의 댓글 수를 1 증가
   * @param postId 게시글 ID
   */
  const incrementCommentCount = (postId: string) => {
    if (commentCounts.value[postId]) {
      commentCounts.value[postId]++;
    } else {
      commentCounts.value[postId] = 1;
    }
  };

  /**
   * 특정 게시글의 댓글 수 조회
   * @param postId 게시글 ID
   * @returns 댓글 수 (없으면 0)
   */
  const getCommentCount = (postId: string) => {
    return commentCounts.value[postId] || 0;
  };

  return {
    // 상태 (읽기 전용)
    commentCounts: readonly(commentCounts),
    
    // 액션
    updateCommentCount,
    incrementCommentCount,
    getCommentCount,
  };
});
