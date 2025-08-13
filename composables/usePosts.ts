/**
 * 게시글 관련 상태 및 API 호출을 관리하는 컴포저블
 *
 * 주요 기능:
 * - 게시글 목록 조회 (무한 스크롤, 페이지네이션)
 * - 게시글 생성, 수정, 삭제
 * - 인기글, 최다 조회글 조회
 * - 검색 및 정렬 기능
 *
 * @author Hit Secret Team
 */

import { ref, readonly } from "vue";
import type {
  Post,
  PostSummary,
  CreatePostRequest,
  EditPostRequest,
  PaginationInfo,
  ApiResponse,
} from "~/types";

/**
 * 게시글 목록 관리를 위한 컴포저블
 * 무한 스크롤과 페이지네이션을 지원
 */
export const usePosts = () => {
  // === 상태 관리 ===

  /** 게시글 목록 */
  const posts = ref<PostSummary[]>([]);

  /** 로딩 상태 */
  const loading = ref(false);

  /** 에러 메시지 */
  const error = ref("");

  /** 더 많은 게시글이 있는지 여부 */
  const hasMore = ref(true);

  /** 다음 페이지를 위한 커서 */
  const nextCursor = ref<string | null>(null);

  // 게시글 목록 조회 - useFetch 버전
  const fetchPosts = async (
    params: {
      sort?: string;
      search?: string;
      cursor?: string;
      limit?: number;
      reset?: boolean;
    } = {}
  ) => {
    if (loading.value || (!hasMore.value && !params.reset)) return;

    // reset이 true면 초기화
    if (params.reset) {
      posts.value = [];
      nextCursor.value = null;
      hasMore.value = true;
    }

    const queryParams = new URLSearchParams({
      sort: params.sort || "created",
      limit: String(params.limit || 20),
    });

    if (params.cursor || nextCursor.value) {
      queryParams.append("cursor", params.cursor || nextCursor.value!);
    }

    if (params.search?.trim()) {
      queryParams.append("search", params.search.trim());
    }

    try {
      const response = await $fetch<
        ApiResponse<{
          posts: PostSummary[];
          pagination: PaginationInfo;
        }>
      >(`/api/posts?${queryParams}`);

      if (response?.success && response.data) {
        const newPosts = response.data.posts;
        posts.value = params.reset ? newPosts : [...posts.value, ...newPosts];
        nextCursor.value = response.data.pagination.nextCursor || null;
        hasMore.value = response.data.pagination.hasMore;
      }
    } catch (fetchError: any) {
      console.error("게시글 로드 실패:", fetchError);
      error.value =
        fetchError.data?.message ||
        fetchError.message ||
        "게시글을 불러오는데 실패했습니다.";
    }
  };

  // 게시글 작성
  const createPost = async (
    postData: CreatePostRequest
  ): Promise<Post | undefined> => {
    try {
      const response = await $fetch("/api/posts", {
        method: "POST",
        body: postData,
      });

      if (response?.success && response.data) {
        useToast().add({
          title: "게시글이 작성되었습니다",
        });

        return response.data as Post;
      }
    } catch (err: any) {
      console.error("게시글 작성 실패:", err);

      useToast().add({
        title: "게시글 작성에 실패했습니다",
        description: err.statusMessage || "잠시 후 다시 시도해주세요.",
        color: "red",
      });

      throw err;
    }
  };

  // 가장 많이 본 글 조회 - $fetch 버전
  const fetchMostViewedPosts = async (
    limit: number = 5
  ): Promise<PostSummary[]> => {
    const response = await $fetch(`/api/posts?sort=views&limit=${limit}`);

    if (response?.success && response.data) {
      return response.data.posts as PostSummary[];
    }
    return [];
  };

  // 인기글 조회 (최근 24시간 내 조회수가 높은 게시글) - $fetch 버전
  const fetchPopularPosts = async (
    limit: number = 5
  ): Promise<PostSummary[]> => {
    const response = await $fetch(`/api/posts/trending?limit=${limit}`);

    if (response?.success && response.data) {
      return response.data.posts as PostSummary[];
    }
    return [];
  };

  // 페이지 기반 게시글 목록 조회 (PostList 컴포넌트용) - $fetch 버전
  const fetchPostsWithPagination = async (
    params: {
      sort?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ posts: PostSummary[]; pagination: any }> => {
    const queryParams = new URLSearchParams({
      sort: params.sort || "created",
      page: String(params.page || 1),
      limit: String(params.limit || 20),
    });

    if (params.search?.trim()) {
      queryParams.append("search", params.search.trim());
    }

    const response = await $fetch(`/api/posts?${queryParams}`);

    if (response?.success && response.data) {
      return {
        posts: response.data.posts as PostSummary[],
        pagination: response.data.pagination,
      };
    }

    throw new Error("게시글을 불러오는데 실패했습니다.");
  };

  // 새로고침
  const refresh = () => {
    fetchPosts({ reset: true });
  };

  return {
    // 상태
    posts: readonly(posts),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),

    // 메서드
    fetchPosts,
    fetchPostsWithPagination,
    createPost,
    fetchMostViewedPosts,
    fetchPopularPosts,
    refresh,
  };
};

/**
 * 개별 게시글 관리를 위한 컴포저블
 * @param postId 게시글 ID
 */
export const usePost = (postId: string) => {
  // === 상태 관리 ===

  /** 게시글 상세 정보 */
  const post = ref<Post | null>(null);

  /** 로딩 상태 */
  const loading = ref(false);

  /** 에러 메시지 */
  const error = ref("");

  // 좋아요 관리
  const {
    isLiked,
    displayLikeCount,
    likePending,
    togglePostLike,
    initializeLikes,
  } = useLikes(postId, "post");

  // 게시글 조회 - $fetch 버전
  const fetchPost = async (): Promise<Post | undefined> => {
    try {
      loading.value = true;
      const response = await $fetch<ApiResponse<Post>>(`/api/posts/${postId}`);

      if (response?.success && response.data) {
        post.value = response.data as Post;
        initializeLikes((response.data as Post).like_count || 0);

        // 게시글 읽음 표시
        try {
          const { addViewedPost } = useLocalStorage();
          addViewedPost(postId);
        } catch (error) {
          console.error("게시글 읽음 표시 실패:", error);
        }

        await incrementViewCount();
        return response.data as Post;
      }
    } catch (fetchError: any) {
      console.error("게시글 조회 실패:", fetchError);
      error.value =
        fetchError.data?.message ||
        fetchError.statusMessage ||
        "게시글을 불러오는데 실패했습니다.";

      useToast().add({
        title: "게시글 조회 실패",
        description: error.value,
        color: "red",
      });
    } finally {
      loading.value = false;
    }
  };

  // 조회수 증가
  const incrementViewCount = async () => {
    if (!post.value) return;

    try {
      // localStorage에서 조회 기록 확인 (24시간 중복 방지)
      const viewTimestamps = JSON.parse(
        localStorage.getItem("board_view_timestamps") || "{}"
      );
      const lastViewTime = viewTimestamps[post.value.id];
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;

      if (!lastViewTime || now - lastViewTime > dayInMs) {
        // API 호출로 조회수 증가
        await $fetch(`/api/posts/${postId}/view`, {
          method: "POST",
        });

        // localStorage에 조회 시간 기록
        viewTimestamps[post.value.id] = now;
        localStorage.setItem(
          "board_view_timestamps",
          JSON.stringify(viewTimestamps)
        );

        // 조회한 게시글 목록에 추가
        const viewedPosts = JSON.parse(
          localStorage.getItem("board_viewed_posts") || "[]"
        );
        if (!viewedPosts.includes(post.value.id)) {
          viewedPosts.push(post.value.id);
          localStorage.setItem(
            "board_viewed_posts",
            JSON.stringify(viewedPosts)
          );
        }
      }
    } catch (error) {
      console.error("조회수 증가 실패:", error);
    }
  };

  // 게시글 수정
  const editPost = async (
    editData: EditPostRequest
  ): Promise<Post | undefined> => {
    try {
      const response = await $fetch(`/api/posts/${postId}/edit`, {
        method: "POST",
        body: editData,
      });

      if (response?.success && response.data) {
        // 현재 post 상태 업데이트 (부분 업데이트 병합)
        if (post.value) {
          post.value = { ...post.value, ...response.data } as Post;
        }

        useToast().add({
          title: "게시글이 수정되었습니다",
        });

        return response.data as Post;
      }
    } catch (err: any) {
      console.error("게시글 수정 실패:", err);

      useToast().add({
        title: "게시글 수정에 실패했습니다",
        description: err.statusMessage || "잠시 후 다시 시도해주세요.",
        color: "red",
      });

      throw err;
    }
  };

  // 게시글 삭제
  const deletePost = async (password: string): Promise<boolean> => {
    try {
      const response = await $fetch(`/api/posts/${postId}`, {
        method: "DELETE" as any,
        body: { password },
      });

      if (response?.success) {
        const deletedImages = (response.data as any)?.deletedImages;
        useToast().add({
          title: "게시글이 삭제되었습니다",
          description: deletedImages
            ? `${deletedImages}개의 이미지가 함께 삭제되었습니다.`
            : undefined,
        });

        return true;
      }
      return false;
    } catch (err: any) {
      console.error("게시글 삭제 실패:", err);
      // 에러를 다시 던져서 호출하는 곳에서 처리하도록 함
      throw err;
    }
  };

  // 게시글 비밀번호 확인
  const verifyPostPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await $fetch(`/api/posts/${postId}/verify`, {
        method: "POST",
        body: { password },
      });

      return response.success as boolean;
    } catch (err: any) {
      console.error("게시글 비밀번호 확인 실패:", err);
      throw err;
    }
  };

  return {
    // 상태
    post: post,
    loading: readonly(loading),
    error: readonly(error),
    isLiked: readonly(isLiked),
    displayLikeCount: readonly(displayLikeCount),
    likePending: readonly(likePending),

    // 메서드
    fetchPost,
    toggleLike: togglePostLike,
    editPost,
    deletePost,
    verifyPostPassword,
  };
};
