// composables/useSidebar.ts

import type { ApiResponse } from "~/types";

export const useSidebar = () => {
  // 최근 댓글 조회 - $fetch 버전
  const fetchRecentComments = async (limit: number = 5) => {
    const response = await $fetch<
      ApiResponse<{
        comments: Comment[];
      }>
    >(`/api/comments/recent?limit=${limit}`);

    if (response?.success && response.data) {
      return response.data.comments;
    }
    return [];
  };

  // 게시판 통계 조회 - $fetch 버전
  const fetchBoardStats = async () => {
    const response = await $fetch<
      ApiResponse<{
        totalPosts: number;
        totalComments: number;
        todayPosts: number;
        todayComments: number;
        lastUpdated: string;
      }>
    >("/api/stats/board");

    if (response?.success && response.data) {
      return response.data;
    }
    return null;
  };

  return {
    fetchRecentComments,
    fetchBoardStats,
  };
};
