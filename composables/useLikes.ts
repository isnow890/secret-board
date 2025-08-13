/**
 * 게시글과 댓글의 좋아요 기능을 관리하는 컴포저블
 * 
 * 주요 기능:
 * - 로컬 스토리지 기반 좋아요 상태 관리
 * - 낙관적 업데이트로 빠른 UI 반응
 * - 서버 오류 시 자동 롤백
 * - 게시글과 댓글 좋아요 통합 처리
 * 
 * @param itemId 게시글 또는 댓글 ID
 * @param itemType 아이템 타입 ('post' | 'comment')
 * @author Hit Secret Team
 */

import { ref, readonly } from "vue";

/**
 * 좋아요 기능 관리 컴포저블
 * @param itemId 좋아요를 관리할 아이템의 ID (게시글 또는 댓글)
 * @param itemType 아이템 타입 구분 ('post' 또는 'comment')
 */
export const useLikes = (itemId: string, itemType: 'post' | 'comment') => {
  // === 상태 관리 ===
  
  /** 현재 사용자의 좋아요 여부 */
  const isLiked = ref(false);
  
  /** 화면에 표시될 좋아요 수 */
  const displayLikeCount = ref(0);
  
  /** 좋아요 처리 중 상태 (중복 클릭 방지) */
  const likePending = ref(false);

  // === 설정 ===
  
  /** localStorage 키 (아이템 타입에 따라 구분) */
  const storageKey = itemType === 'post' ? 'board_liked_posts' : 'board_liked_comments';

  // === 로컬 상태 관리 ===
  
  /**
   * localStorage에서 좋아요 상태를 확인
   * 페이지 로드 시 또는 초기화 시 호출
   */
  const checkLikeStatus = () => {
    try {
      const likedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
      isLiked.value = likedItems.includes(itemId);
    } catch (error) {
      console.error("좋아요 상태 확인 실패:", error);
      isLiked.value = false;
    }
  };

  /**
   * 좋아요 상태를 localStorage에 저장
   * @param liked 좋아요 여부 (true: 좋아요, false: 좋아요 취소)
   */
  const updateLikeStorage = (liked: boolean) => {
    try {
      const likedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
      
      if (liked) {
        if (!likedItems.includes(itemId)) {
          likedItems.push(itemId);
        }
      } else {
        const index = likedItems.indexOf(itemId);
        if (index > -1) {
          likedItems.splice(index, 1);
        }
      }
      
      localStorage.setItem(storageKey, JSON.stringify(likedItems));
    } catch (error) {
      console.error("좋아요 상태 저장 실패:", error);
    }
  };

  // === 게시글 좋아요 ===
  
  /**
   * 게시글 좋아요를 토글 (추가/취소)
   * 서버 응답을 기다린 후 UI 업데이트 (안정성 우선)
   * @returns 서버 응답 데이터 (좋아요 수 포함)
   */
  const togglePostLike = async () => {
    if (likePending.value) return;

    likePending.value = true;

    try {
      const action = isLiked.value ? "unlike" : "like";

      const response = await $fetch(`/api/posts/${itemId}/like`, {
        method: "POST",
        body: { action },
      });

      if (response?.success && response.data) {
        // 좋아요 상태 토글
        isLiked.value = !isLiked.value;
        displayLikeCount.value = response.data.like_count || 0;

        // localStorage에 상태 저장
        updateLikeStorage(isLiked.value);

        return response.data;
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);

      useToast().add({
        title: "좋아요 처리 실패",
        description: "잠시 후 다시 시도해주세요.",
        color: "red",
      });
    } finally {
      likePending.value = false;
    }
  };

  // === 댓글 좋아요 ===
  
  /**
   * 댓글 좋아요를 토글 (낙관적 업데이트)
   * UI를 먼저 업데이트하고 서버 오류 시 롤백 (응답성 우선)
   * @param currentLikeCount 현재 좋아요 수
   * @returns 서버 응답 데이터
   */
  const toggleCommentLike = async (currentLikeCount: number) => {
    if (likePending.value) return;

    likePending.value = true;

    try {
      const newLikedState = !isLiked.value;

      // UI 상태 먼저 업데이트 (낙관적 업데이트)
      isLiked.value = newLikedState;
      displayLikeCount.value = newLikedState
        ? currentLikeCount + 1
        : Math.max(0, currentLikeCount - 1);

      // LocalStorage 업데이트
      updateLikeStorage(newLikedState);

      // 서버에 좋아요 상태 전달
      try {
        const response = await $fetch(`/api/comments/${itemId}/like`, {
          method: "POST",
          body: { liked: newLikedState },
        });

        // 서버에서 받은 정확한 like_count로 업데이트
        if (response.success && response.data) {
          displayLikeCount.value = response.data.like_count ?? currentLikeCount ?? 0;
        }

        return response.data;
      } catch (serverError) {
        console.error("서버 좋아요 처리 실패:", serverError);
        // 서버 오류 시 상태 롤백
        isLiked.value = !newLikedState;
        displayLikeCount.value = currentLikeCount;
        updateLikeStorage(!newLikedState);
        throw serverError;
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      // 전체 롤백
      checkLikeStatus();
    } finally {
      likePending.value = false;
    }
  };

  // === 유틸리티 ===
  
  /**
   * 좋아요 수를 직접 설정
   * 서버에서 받은 정확한 값으로 동기화할 때 사용
   * @param count 설정할 좋아요 수
   */
  const setLikeCount = (count: number) => {
    displayLikeCount.value = count;
  };

  /**
   * 좋아요 상태 초기화
   * 컴포넌트 마운트 시 호출하여 localStorage 상태와 동기화
   * @param initialCount 서버에서 받은 초기 좋아요 수 (기본값: 0)
   */
  const initializeLikes = (initialCount: number = 0) => {
    displayLikeCount.value = initialCount;
    checkLikeStatus();
  };

  return {
    // 상태
    isLiked: readonly(isLiked),
    displayLikeCount: readonly(displayLikeCount),
    likePending: readonly(likePending),

    // 메서드
    checkLikeStatus,
    togglePostLike,
    toggleCommentLike,
    setLikeCount,
    initializeLikes,
  };
};