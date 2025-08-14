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

import { ref, readonly, onUnmounted } from "vue";
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
      const response = (await $fetch(
        `/api/posts?${queryParams}`
      )) as ApiResponse<{
        posts: PostSummary[];
        pagination: PaginationInfo;
      }>;

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

  /** 실시간 구독 상태 */
  const realtimeChannel = ref<any>(null);

  /** AI 요약 생성 중 상태 */
  const aiSummaryGenerating = ref(false);

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
      const response = (await $fetch(
        `/api/posts/${postId}`
      )) as ApiResponse<Post>;

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

        // AI 요약 생성 중 상태 확인
        const postData = response.data as Post;
        if (!postData.ai_summary && postData.content) {
          // HTML에서 텍스트 길이 확인
          const textLength = postData.content
            .replace(/<[^>]*>/g, "")
            .trim().length;
          if (textLength >= 100) {
            aiSummaryGenerating.value = true;
            console.log("🤖 AI summary generation in progress...");
          }
        }

        // 게시글 로드 후 실시간 구독 설정
        setupRealtimeSubscription();

        return postData;
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
          const updatedPost = { ...post.value, ...response.data } as Post;
          post.value = updatedPost;

          // 수정된 내용이 충분히 길면 AI 요약 재생성 중 상태 활성화
          if (updatedPost.content) {
            const textLength = updatedPost.content
              .replace(/<[^>]*>/g, "")
              .trim().length;
            if (textLength >= 100) {
              // AI 요약 초기화하고 생성 중 상태 활성화
              post.value.ai_summary = null;
              post.value.summary_generated_at = null;
              aiSummaryGenerating.value = true;
              console.log(
                "🤖 AI summary regeneration in progress after edit..."
              );

              // 토스트로 사용자에게 알림
              useToast().add({
                title: "AI 요약 재생성 중",
                description: "잠시 후 새로운 요약이 표시됩니다.",
                color: "blue",
              });
            }
          }
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
      const response = (await $fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        body: {
          password: password,
        },
      })) as ApiResponse<{
        deletedImages: number;
        deletedAttachments: number;
      }>;

      if (response?.success) {
        const deletedImages = response.data?.deletedImages;
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

  // 실시간 구독 설정 (AI 요약 업데이트 감지)
  const setupRealtimeSubscription = () => {
    if (!post.value || realtimeChannel.value) {
      console.log("🔄 Realtime subscription setup skipped:", {
        hasPost: !!post.value,
        hasChannel: !!realtimeChannel.value,
        postId,
      });
      return;
    }

    const supabase = useSupabaseClient();

    console.log("🔄 Setting up realtime subscription for post:", postId);
    console.log("📡 Supabase client ready:", !!supabase);
    console.log("📄 Current post state:", {
      id: post.value?.id,
      hasAiSummary: !!post.value?.ai_summary,
      aiSummaryGenerating: aiSummaryGenerating.value,
    });

    // AI 요약 업데이트를 위한 실시간 채널 생성
    const channelName = `post-${postId}`;
    console.log("📺 Creating channel:", channelName);

    realtimeChannel.value = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          console.log("📡 Post updated via realtime:", {
            event: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            old: payload.old,
            new: payload.new,
          });

          // AI 요약이 업데이트된 경우만 처리
          if (payload.new && post.value) {
            const newPost = payload.new as any;
            const oldSummary = post.value.ai_summary;
            const newSummary = newPost.ai_summary;

            console.log("📝 Summary comparison:", {
              old: oldSummary,
              new: newSummary,
              changed: oldSummary !== newSummary,
            });

            // AI 요약이나 생성시간이 변경되었는지 확인
            if (
              newPost.ai_summary !== post.value.ai_summary ||
              newPost.summary_generated_at !== post.value.summary_generated_at
            ) {
              console.log("✅ AI summary changed, updating post state");

              // post 상태 업데이트
              post.value = {
                ...post.value,
                ai_summary: newPost.ai_summary,
                summary_generated_at: newPost.summary_generated_at,
              } as Post;

              console.log(
                "📄 AI summary updated via realtime:",
                newPost.ai_summary
              );

              // AI 요약이 생성되면 생성 중 상태 해제
              if (newPost.ai_summary) {
                aiSummaryGenerating.value = false;
                console.log("🤖 AI summary generation completed");

                // 수정시에만 토스트 알림 표시
                if (oldSummary === null || oldSummary === undefined) {
                  useToast().add({
                    title: "AI 요약 완료",
                    description: "새로운 요약이 생성되었습니다.",
                    color: "green",
                  });
                }
              }
            } else {
              console.log("📭 No AI summary changes detected");
            }
          } else {
            console.log("⚠️ No payload.new or post.value missing");
          }
        }
      )
      .subscribe((status) => {
        console.log("📺 Realtime subscription status:", status);
      });
  };

  // 실시간 구독 정리
  const cleanupRealtimeSubscription = () => {
    if (realtimeChannel.value) {
      realtimeChannel.value.unsubscribe();
      realtimeChannel.value = null;
      console.log("Realtime subscription cleaned up");
    }
  };

  // 컴포넌트가 언마운트될 때 정리
  onUnmounted(() => {
    cleanupRealtimeSubscription();
  });

  return {
    // 상태
    post: post,
    loading: readonly(loading),
    error: readonly(error),
    isLiked: readonly(isLiked),
    displayLikeCount: readonly(displayLikeCount),
    likePending: readonly(likePending),
    aiSummaryGenerating: readonly(aiSummaryGenerating),

    // 메서드
    fetchPost,
    toggleLike: togglePostLike,
    editPost,
    deletePost,
    verifyPostPassword,
    setupRealtimeSubscription,
    cleanupRealtimeSubscription,
  };
};
