<!-- components/PostList.vue -->
<template>
  <div class="post-list">
    <!-- 게시글 목록 -->
    <div v-if="posts.length > 0" class="divide-y divide-border-muted">
      <template v-for="(post, index) in posts" :key="post.id">
        <PostItem :post="post" />
        
        <!-- 4개마다 쿠팡 광고 삽입 (단, 마지막 게시글 이후는 제외) -->
        <div 
          v-if="shouldShowAd(index) && index < posts.length - 1" 
          class="py-6 border-b border-border-muted bg-background-secondary/30"
        >
          <div class="w-full px-4">
            <CoupangAd 
              v-if="adEnabled && postAdUrl"
              :src="postAdUrl" 
              :height="70" 
              :width="'80%'"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- 로딩 스켈레톤 (더 많은 데이터 로딩 시) -->
    <PostListSkeleton v-if="loading && posts.length > 0" :count="3" />

    <!-- 초기 로딩 -->
    <PostListSkeleton v-if="loading && posts.length === 0" :count="5" />

    <!-- 에러 상태 -->
    <div v-if="error" class="text-center py-8">
      <Icon
        name="lucide:alert-circle"
        class="w-16 h-16 mx-auto text-status-error opacity-60 mb-4"
      />
      <p class="text-status-error font-medium mb-2">
        게시글을 불러오지 못했습니다
      </p>
      <p class="text-text-secondary mb-4">{{ error }}</p>
      <button @click="retry" class="btn btn-primary">다시 시도</button>
    </div>

    <!-- 빈 상태 -->
    <PostListEmpty
      v-if="!loading && !error && posts.length === 0 && initialLoaded"
    />

    <!-- 페이지 네비게이션 -->
    <div v-if="!loading && !error && posts.length > 0" class="space-y-4">
      <!-- 모바일용 이전/다음 버튼 (모바일에서만 표시) -->
      <div class="flex justify-between pt-4 items-center space-x-4 sm:hidden">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1 || loading"
          class="btn btn-sm"
          :class="{
            'opacity-50 cursor-not-allowed': currentPage === 1 || loading,
          }"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4 mr-1" />
          이전
        </button>

        <span class="text-sm text-text-secondary">
          {{ currentPage }} / {{ totalPages }}
        </span>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage >= totalPages || loading"
          class="btn btn-sm"
          :class="{
            'opacity-50 cursor-not-allowed':
              currentPage >= totalPages || loading,
          }"
        >
          다음
          <Icon name="lucide:chevron-right" class="w-4 h-4 ml-1" />
        </button>
      </div>

      <!-- 데스크탑용 페이지네이션 컴포넌트 (데스크탑에서만 표시) -->
      <div class="hidden sm:block">
        <PostListPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
          @page-change="goToPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from "~/types";

// usePosts composable 사용
const { fetchPostsWithPagination } = usePosts();

// 환경변수에서 쿠팡 광고 설정 가져오기
const config = useRuntimeConfig();
const adEnabled = computed(() => config.public.adVisible === 'true' && config.public.adPostDetailEnabled === 'true');
const postAdUrl = computed(() => config.public.coupangPostAdUrl);

const posts = ref<PostSummary[]>([]);
const loading = ref(false);
const error = ref("");
const initialLoaded = ref(false); // 첫 로딩 완료 여부
const route = useRoute();
const router = useRouter();
const currentSort = ref("created");

// 페이지네이션 관련 상태
const currentPage = ref(1);
const itemsPerPage = 10;
const totalItems = ref(0);

// URL 쿼리에서 페이지 가져오기
const updateFromQuery = () => {
  currentPage.value = parseInt((route.query.page as string) || "1", 10);
};

// 라우트 변경 감지 (페이지와 검색 쿼리 모두 감지)
watch([() => route.query.page, () => route.query.search], () => {
  updateFromQuery();
  loadPosts();
});

// URL 업데이트
const updateURL = () => {
  const query: Record<string, string> = {};

  if (currentPage.value > 1) {
    query.page = currentPage.value.toString();
  }

  router.push({ query });
};

// 페이지네이션 computed
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / itemsPerPage))
);

// 4개마다 광고 표시 여부 결정
const shouldShowAd = (index: number): boolean => {
  // 인덱스가 0부터 시작하므로 (index + 1)이 4의 배수일 때 광고 표시
  return (index + 1) % 4 === 0;
};

const loadPosts = async () => {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    const result = await fetchPostsWithPagination({
      sort: currentSort.value,
      page: currentPage.value,
      limit: itemsPerPage,
      search: (route.query.search as string) || "", // 검색 쿼리 추가
    });

    posts.value = result.posts;
    totalItems.value = result.pagination.totalCount;
  } catch (err: any) {
    console.error("게시글 로드 실패:", err);
    error.value =
      err.data?.message || err.message || "게시글을 불러오는데 실패했습니다.";
    posts.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
    initialLoaded.value = true;
  }
};

const retry = () => {
  error.value = "";
  loadPosts();
};

// 페이지 네비게이션
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || loading.value) return;

  currentPage.value = page;
  updateURL();

  // 페이지 상단으로 스크롤
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 초기 로드
onMounted(() => {
  updateFromQuery();
  loadPosts();
});

// 컴포넌트 외부에서 새로고침 가능하도록 노출
defineExpose({
  refresh: () => {
    updateFromQuery();
    loadPosts();
  },
  isLoading: () => loading.value,
});
</script>
