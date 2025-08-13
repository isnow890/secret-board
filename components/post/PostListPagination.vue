<!-- components/PostListPagination.vue -->
<template>
  <div class="flex justify-center items-center space-x-1 sm:space-x-2 mt-8 pt-8">
    <!-- 페이지 번호들만 표시 (데스크탑용) -->
    <div class="flex items-center space-x-0.5 sm:space-x-1">
      <!-- 첫 페이지 -->
      <button
        v-if="showFirstPage"
        @click="$emit('page-change', 1)"
        class="btn btn-sm min-w-[32px] sm:min-w-[40px]"
        :class="{ 'btn-primary': currentPage === 1 }"
      >
        1
      </button>

      <!-- 첫 페이지 생략 부호 -->
      <span v-if="showFirstEllipsis" class="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>

      <!-- 중간 페이지들 -->
      <button
        v-for="page in visiblePages"
        :key="page"
        @click="$emit('page-change', page)"
        class="btn btn-sm min-w-[32px] sm:min-w-[40px]"
        :class="{ 'btn-primary': currentPage === page }"
      >
        {{ page }}
      </button>

      <!-- 마지막 페이지 생략 부호 -->
      <span v-if="showLastEllipsis" class="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>

      <!-- 마지막 페이지 -->
      <button
        v-if="showLastPage"
        @click="$emit('page-change', totalPages)"
        class="btn btn-sm min-w-[32px] sm:min-w-[40px]"
        :class="{ 'btn-primary': currentPage === totalPages }"
      >
        {{ totalPages }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number;
  totalPages: number;
  loading?: boolean;
}

interface Emits {
  (e: "page-change", page: number): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const visiblePages = computed(() => {
  const current = props.currentPage;
  const total = props.totalPages;
  
  const delta = 2; // 현재 페이지 주변 2페이지씩 표시
  const maxPages = 8; // 최대 8개 페이지 표시

  // 총 페이지가 1개면 1만 표시
  if (total === 1) {
    return [1];
  }

  // 총 페이지가 적으면 모든 페이지 표시
  if (total <= maxPages) {
    const range = [];
    for (let i = 1; i <= total; i++) {
      range.push(i);
    }
    return range;
  }

  // 많은 페이지의 경우 - 첫 페이지와 마지막 페이지 제외한 중간 페이지들
  const range = [];
  
  // 현재 페이지 주변의 페이지들을 계산 (1과 마지막 페이지 제외)
  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(total - 1, current + delta);

  // 중간 페이지들만 포함 (1번과 마지막 페이지는 별도로 처리)
  for (let i = rangeStart; i <= rangeEnd; i++) {
    range.push(i);
  }

  return range;
});

const showFirstPage = computed(() => {
  const total = props.totalPages;
  const maxPages = 8;
  
  // 최대 페이지 수보다 많으면 1번 페이지를 항상 표시
  return total > maxPages;
});

const showLastPage = computed(() => {
  const total = props.totalPages;
  const maxPages = 8;
  
  // Show last page if totalPages > maxPages and it's not already included in visiblePages
  return total > maxPages && !visiblePages.value.includes(total);
});

const showFirstEllipsis = computed(() => {
  const total = props.totalPages;
  const maxPages = 8;
  const threshold = 4; // 8페이지 기준 적절한 임계값
  
  return total > maxPages && props.currentPage > threshold;
});

const showLastEllipsis = computed(() => {
  const total = props.totalPages;
  const maxPages = 8;
  
  // Show ellipsis if there's a gap between visiblePages and the last page
  const pages = visiblePages.value;
  const lastPage = pages.length > 0 ? pages[pages.length - 1] : 0;
  return total > maxPages && !pages.includes(total) && pages.length > 0 && (lastPage ?? 0) < total - 1;
});
</script>

<style scoped>
/* 페이지네이션 컨테이너에서 스크롤 방지 */
.flex {
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
}

.flex::-webkit-scrollbar { /* WebKit */
  display: none;
}
</style>
