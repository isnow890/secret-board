<!-- components/sidebar/PopularPosts.vue -->
<template>
  <div class="space-y-3">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="flex items-start space-x-3">
          <div class="w-6 h-4 bg-background-tertiary rounded"></div>
          <div class="flex-1">
            <div class="h-4 bg-background-tertiary rounded w-3/4 mb-1"></div>
            <div class="h-3 bg-background-tertiary rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 에러 상태 -->
    <UiAlert v-else-if="error" variant="error" class="text-center py-4">
      <div class="text-center">
        <Icon name="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
        <p class="text-xs">불러오기 실패</p>
      </div>
    </UiAlert>

    <!-- 인기글 목록 -->
    <div v-else-if="posts.length > 0" class="space-y-0">
      <div
        v-for="(post, index) in posts"
        :key="post.id"
        class="group cursor-pointer hover:bg-interactive-hover transition-colors"
        :class="{ 'border-b border-border-muted': index < posts.length - 1 }"
        @click="navigateToPost(post.id)"
      >
        <div class="p-3">
          <h4
            class="text-sm font-medium transition-colors line-clamp-2 leading-tight mb-2"
            :class="[
              post.is_deleted 
                ? 'line-through text-text-quaternary opacity-60'
                : isViewed(post.id)
                  ? 'text-text-tertiary group-hover:text-text-secondary'
                  : 'text-text-primary group-hover:text-primary-500'
            ]"
          >
            {{ post.is_deleted ? '[삭제됨] ' + post.title : post.title }}
          </h4>
          <div
            class="flex items-center justify-between text-xs text-text-tertiary"
          >
            <div class="flex items-center space-x-2">
              <span class="flex items-center">
                <Icon name="lucide:user" class="w-3 h-3 mr-1" />
                <span class="text-text-quaternary">{{ post.nickname }}</span>
              </span>
              <span class="flex items-center">
                <Icon name="lucide:eye" class="w-3 h-3 mr-1" />
                {{ formatNumber(post.view_count ?? 0) }}
              </span>
              <span class="flex items-center">
                <Icon name="lucide:heart" class="w-3 h-3 mr-1" />
                {{ formatNumber(post.like_count ?? 0) }}
              </span>
            </div>
            <span class="flex-shrink-0">{{
              formatTimeAgo(post.created_at ?? new Date().toISOString())
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="text-center py-4">
      <Icon
        name="lucide:inbox"
        class="w-8 h-8 mx-auto text-text-tertiary mb-2"
      />
      <p class="text-xs text-text-tertiary">인기글이 없습니다</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from "~/types";

const posts = ref<PostSummary[]>([]);
const loading = ref(true);
const error = ref("");

// usePosts composable 사용
const { fetchPopularPosts } = usePosts();

const loadPopularPosts = async () => {
  try {
    loading.value = true;
    error.value = "";

    const fetchedPosts = await fetchPopularPosts(5);
    posts.value = fetchedPosts;
    updateViewedPosts();
  } catch (err: any) {
    console.error("인기글 로드 실패:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const navigateToPost = (postId: string) => {
  navigateTo(`/post/${postId}`);
};

const { formatNumber, formatTimeAgo } = useUtils();

// 읽은 글 상태 확인
const viewedPosts = ref<Set<string>>(new Set());

const isViewed = (postId: string): boolean => {
  return viewedPosts.value.has(postId);
};

const updateViewedPosts = () => {
  try {
    const { isPostViewed } = useLocalStorage();
    const newViewedPosts = new Set<string>();

    posts.value.forEach((post) => {
      if (isPostViewed(post.id)) {
        newViewedPosts.add(post.id);
      }
    });

    viewedPosts.value = newViewedPosts;
  } catch (error) {
    console.error("읽은 글 상태 확인 실패:", error);
  }
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadPopularPosts();

  // localStorage 변경사항 감지
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "board_viewed_posts") {
      updateViewedPosts();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // 페이지 포커스 시 상태 업데이트
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      updateViewedPosts();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // 클라이언트에서만 자동 새로고침 설정
  if (process.client) {
    const refreshInterval = setInterval(() => {
      loadPopularPosts();
    }, 5 * 60 * 1000);

    onBeforeUnmount(() => {
      clearInterval(refreshInterval);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
