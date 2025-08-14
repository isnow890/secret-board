import type { ApiResponse, RecentComment, BoardStats } from "~/types";

/**
 * @description 사이드바 위젯에 필요한 데이터를 비동기적으로 불러오는 컴포저블입니다.
 */
export const useSidebar = () => {
  /**
   * @description 최근 작성된 댓글 목록을 가져옵니다.
   * @param {number} [limit=5] - 가져올 댓글의 수
   * @returns {Promise<RecentComment[]>} 최근 댓글 목록
   */
  const fetchRecentComments = async (limit: number = 5): Promise<RecentComment[]> => {
    try {
      const response = (await $fetch(`/api/comments/recent?limit=${limit}`)) as ApiResponse<{ comments: RecentComment[] }>;
      return response?.success ? response.data?.comments || [] : [];
    } catch (error) {
      console.error("최근 댓글 조회 실패:", error);
      return [];
    }
  };

  /**
   * @description 게시판의 전체 통계 정보를 가져옵니다.
   * @returns {Promise<BoardStats | null>} 게시판 통계 정보 또는 실패 시 null
   */
  const fetchBoardStats = async (): Promise<BoardStats | null> => {
    try {
      const response = (await $fetch("/api/stats/board")) as ApiResponse<BoardStats>;
      return response?.success ? response.data : null;
    } catch (error) {
      console.error("게시판 통계 조회 실패:", error);
      return null;
    }
  };

  return {
    fetchRecentComments,
    fetchBoardStats,
  };
};
