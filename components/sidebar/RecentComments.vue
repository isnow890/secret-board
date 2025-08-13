<!-- components/sidebar/RecentComments.vue -->
<template>
  <div class="space-y-3">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="space-y-2">
          <div class="h-3 bg-background-tertiary rounded w-3/4"></div>
          <div class="h-4 bg-background-tertiary rounded"></div>
          <div class="h-3 bg-background-tertiary rounded w-1/2"></div>
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

    <!-- 최근 댓글 목록 -->
    <div v-else-if="comments.length > 0" class="space-y-0">
      <div
        v-for="(comment, index) in comments"
        :key="comment.id"
        class="group cursor-pointer hover:bg-interactive-hover transition-colors"
        :class="{ 'border-b border-border-muted': index < comments.length - 1 }"
        @click="navigateToPost(comment.post_id)"
      >
        <div class="p-3 space-y-2">
          <!-- 게시글 제목 -->
          <h4
            class="text-xs text-text-secondary group-hover:text-primary-500 transition-colors line-clamp-1"
          >
            {{ comment.post_title }}
          </h4>

          <!-- 댓글 내용 -->
          <p class="text-sm text-text-primary line-clamp-2 leading-tight">
            {{ comment.content }}
          </p>

          <!-- 댓글 메타 정보 -->
          <div
            class="flex items-center justify-between text-xs text-text-tertiary"
          >
            <div class="flex items-center space-x-2">
              <span class="flex items-center">
                <Icon name="lucide:user" class="w-3 h-3 mr-1" />
                {{ comment.nickname }}
              </span>
              <span v-if="comment.is_author" class="flex items-center text-status-success">
                <Icon name="lucide:edit-3" class="w-3 h-3 mr-1" />
                글쓴이
              </span>
              <span v-if="comment.depth > 0" class="flex items-center">
                <Icon name="lucide:corner-down-right" class="w-3 h-3 mr-1" />
                답글
              </span>
            </div>
            <span>{{ formatTimeAgo(comment.created_at) }}</span>
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
      <p class="text-xs text-text-tertiary">최근 댓글이 없습니다</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RecentComment {
  id: string;
  content: string;
  nickname: string;
  post_id: string;
  post_title: string;
  is_author: boolean;
  depth: number;
  created_at: string;
}

// useSidebar composable 사용
const { fetchRecentComments } = useSidebar();

const comments = ref<RecentComment[]>([]);
const loading = ref(true);
const error = ref("");

const loadRecentComments = async () => {
  try {
    loading.value = true;
    error.value = "";

    const fetchedComments = await fetchRecentComments(5);
    comments.value = fetchedComments;
  } catch (err: any) {
    console.error("최근 댓글 로드 실패:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const navigateToPost = (postId: string) => {
  navigateTo(`/post/${postId}`);
};

const { formatTimeAgo } = useUtils();

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadRecentComments();

  // 클라이언트에서만 자동 새로고침 설정
  if (process.client) {
    const refreshInterval = setInterval(() => {
      loadRecentComments();
    }, 3 * 60 * 1000);

    onBeforeUnmount(() => {
      clearInterval(refreshInterval);
    });
  }
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
