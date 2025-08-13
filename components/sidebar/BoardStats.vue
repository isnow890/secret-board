<!-- components/sidebar/BoardStats.vue -->
<template>
  <div class="space-y-3">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="animate-pulse">
        <div class="flex justify-between items-center">
          <div class="h-4 bg-background-tertiary rounded w-1/2"></div>
          <div class="h-4 bg-background-tertiary rounded w-1/4"></div>
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

    <!-- 통계 정보 -->
    <div v-else class="space-y-0">
      <div
        class="px-3 py-1 flex justify-between items-center border-b border-border-muted"
      >
        <span class="text-sm text-text-secondary"> 전체 게시글 </span>
        <span class="text-sm font-semibold text-text-primary">
          {{ formatNumber(stats.totalPosts) }}
        </span>
      </div>

      <div
        class="px-3 py-1 flex justify-between items-center border-b border-border-muted"
      >
        <span class="text-sm text-text-secondary"> 전체 댓글 </span>
        <span class="text-sm font-semibold text-text-primary">
          {{ formatNumber(stats.totalComments) }}
        </span>
      </div>

      <div
        class="px-3 py-1 flex justify-between items-center border-b border-border-muted"
      >
        <span class="text-sm text-text-secondary"> 오늘 게시글 </span>
        <span class="text-sm font-semibold text-text-primary">
          {{ formatNumber(stats.todayPosts) }}
        </span>
      </div>

      <div
        class="px-3 py-1 flex justify-between items-center border-b border-border-muted"
      >
        <span class="text-sm text-text-secondary"> 오늘 댓글 </span>
        <span class="text-sm font-semibold text-text-primary">
          {{ formatNumber(stats.todayComments) }}
        </span>
      </div>

      <!-- 구분선 -->
      <div class="p-3">
        <div class="text-xs text-text-tertiary text-center">
          마지막 업데이트: {{ formatTimeAgo(stats.lastUpdated) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BoardStats {
  totalPosts: number;
  totalComments: number;
  todayPosts: number;
  todayComments: number;
  lastUpdated: string;
}

const stats = ref<BoardStats>({
  totalPosts: 0,
  totalComments: 0,
  todayPosts: 0,
  todayComments: 0,
  lastUpdated: new Date().toISOString(),
});

// useSidebar composable 사용
const { fetchBoardStats } = useSidebar();

const loading = ref(true);
const error = ref("");

const loadBoardStats = async () => {
  try {
    loading.value = true;
    error.value = "";

    const fetchedStats = await fetchBoardStats();
    if (fetchedStats) {
      stats.value = fetchedStats;
    }
  } catch (err: any) {
    console.error("게시판 통계 로드 실패:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const { formatNumber, formatTimeAgo } = useUtils();

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadBoardStats();

  // 클라이언트에서만 자동 새로고침 설정
  if (process.client) {
    const refreshInterval = setInterval(() => {
      loadBoardStats();
    }, 15 * 60 * 1000);

    onBeforeUnmount(() => {
      clearInterval(refreshInterval);
    });
  }
});
</script>
