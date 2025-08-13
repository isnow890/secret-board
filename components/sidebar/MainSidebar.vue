<!-- components/MainSidebar.vue -->
<template>
  <div class="space-y-8">
    <!-- 인기글 위젯 -->
    <div>
      <h3 class="text-sm font-semibold text-text-primary mb-3">인기글</h3>
      <div
        class="bg-background-secondary rounded-xl border border-border-muted overflow-hidden"
      >
        <div class="p-4">
          <PopularPosts />
        </div>
      </div>
    </div>

    <!-- 가장 많이 본 글 위젯 -->
    <div>
      <h3 class="text-sm font-semibold text-text-primary mb-3">
        가장 많이 본 글
      </h3>
      <div
        class="bg-background-secondary rounded-xl border border-border-muted overflow-hidden"
      >
        <div class="p-4">
          <MostViewedPosts />
        </div>
      </div>
    </div>

    <!-- 쿠팡 광고 배너 (가장 많이 본 글과 최근 댓글 사이) -->
    <div v-if="shouldShowAd">
      <CoupangAd 
        :src="sidebarAdUrl"
        :width="'80%'"
        :height="210"
      />
    </div>

    <!-- 최근 댓글 위젯 -->
    <div>
      <h3 class="text-sm font-semibold text-text-primary mb-3">최근 댓글</h3>
      <div
        class="bg-background-secondary rounded-xl border border-border-muted overflow-hidden"
      >
        <div class="p-4">
          <RecentComments />
        </div>
      </div>
    </div>

    <!-- 통계 위젯 -->
    <div>
      <h3 class="text-sm font-semibold text-text-primary mb-3">게시판 통계</h3>
      <div
        class="bg-background-secondary rounded-xl border border-border-muted overflow-hidden"
      >
        <div class="p-4">
          <BoardStats />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

// 사이드바 광고 표시 여부
const shouldShowAd = computed(() => {
  return config.public.adVisible !== 'false' && config.public.adSidebarEnabled !== 'false'
})

// 사이드바 광고 URL
const sidebarAdUrl = computed(() => {
  return config.public.coupangSidebarAdUrl || ''
})
</script>
