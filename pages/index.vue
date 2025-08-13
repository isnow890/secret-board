<!-- pages/index.vue -->
<template>
  <div class="min-h-screen bg-background-primary">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 py-8">
      <!-- Page Header -->
      <PageHeader>
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 class="text-lg md:text-2xl font-bold text-text-primary mb-1">
              최근 게시글
            </h1>
            <p class="text-text-secondary">
              자유롭게 소통하고 의견을 나누어보세요
            </p>
          </div>

          <!-- Search functionality moved here -->
          <div class="flex-shrink-0 w-full sm:w-80">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="게시글 검색..."
                class="w-full pl-10 pr-10 py-2.5 bg-background-secondary border border-border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent focus:bg-background-elevated text-sm text-text-primary"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                @input="handleSearch"
                @keydown.enter="performSearch"
              />
              <Icon
                name="lucide:search"
                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary"
              />

              <!-- Clear search button -->
              <button
                v-if="searchQuery"
                @click="clearSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </PageHeader>

      <!-- 2컬럼 레이아웃 -->
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- 메인 콘텐츠 -->
        <div class="flex-1 lg:max-w-none">
          <PostList ref="postListRef" />
        </div>

        <!-- 사이드바 -->
        <div class="w-full lg:w-80 flex-shrink-0sss">
          <MainSidebar />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 페이지 메타 설정
useHead({
  title: "최근 게시글 - Secret Board",
  meta: [
    { name: "description", content: "최신 게시글을 확인하고 자유롭게 소통하세요. 완전한 익명성이 보장되는 사내 게시판입니다." },
    { property: "og:title", content: "최근 게시글 - Secret Board" },
    { property: "og:description", content: "최신 게시글을 확인하고 자유롭게 소통하세요. 완전한 익명성이 보장되는 사내 게시판입니다." },
    { property: "og:url", content: "https://hit.eumc.ac.kr/secret/" },
    { name: "twitter:title", content: "최근 게시글 - Secret Board" },
    { name: "twitter:description", content: "최신 게시글을 확인하고 자유롭게 소통하세요. 완전한 익명성이 보장되는 사내 게시판입니다." }
  ]
});

const route = useRoute();
const router = useRouter();
const postListRef = ref();
const searchQuery = ref("");

// Search functionality moved from header
const handleSearch = useDebounceFn(() => {
  performSearch();
}, 300);

const performSearch = () => {
  router.push({
    query: searchQuery.value ? { search: searchQuery.value } : {},
  });
};

const clearSearch = () => {
  searchQuery.value = "";
  router.push({ query: {} });
};

// Initialize search query from URL
onMounted(() => {
  searchQuery.value = (route.query.search as string) || "";
});

// 현재 상태 저장 (페이지, 검색어, 정렬)
const saveCurrentState = () => {
  try {
    const { setStorageData } = useLocalStorage();
    const currentPage = parseInt(route.query.page as string) || 1;
    const currentParams = {
      sort: (route.query.sort as string) || "",
      search: (route.query.search as string) || "",
    };

    setStorageData("board_last_page", currentPage);
    setStorageData("board_last_params", currentParams);
  } catch (error) {
    console.error("현재 상태 저장 실패:", error);
  }
};

// Watch route changes
watch(
  () => route.query,
  () => {
    searchQuery.value = (route.query.search as string) || "";
    // 라우트 변경 시 현재 상태 저장
    saveCurrentState();
  },
  { immediate: true }
);

// 페이지가 활성화될 때마다 게시글 목록 새로고침
onActivated(() => {
  if (postListRef.value && typeof postListRef.value.refresh === "function") {
    postListRef.value.refresh();
  }
});
</script>
