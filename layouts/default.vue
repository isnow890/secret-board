<!-- layouts/default.vue -->
<template>
  <div class="layout-wrapper">
    <!-- 클라이언트에서만 인증 상태 확인 -->
    <ClientOnly>
      <!-- 인증 상태 확인 중 로딩 -->
      <div v-if="!isInitialized" class="min-h-screen bg-background-primary flex items-center justify-center">
        <div class="text-center">
          <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-text-tertiary mx-auto mb-4" />
          <p class="text-text-secondary">로딩 중...</p>
        </div>
      </div>

      <!-- 메인 레이아웃 (인증 완료 후 표시) -->
      <template v-else>
        <!-- Header -->
        <SiteHeader />
        
        <!-- Main Content -->
        <main class="main-content">
          <slot />
        </main>
        
        <!-- Footer -->
        <LayoutFooter />
        
        <!-- Toast Notifications -->
        <Toast />
      </template>
      
      <!-- 서버사이드 fallback -->
      <template #fallback>
        <div class="min-h-screen bg-background-primary flex items-center justify-center">
          <div class="text-center">
            <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-text-tertiary mx-auto mb-4" />
            <p class="text-text-secondary">로딩 중...</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// 기본 레이아웃 설정
// Header와 Footer 컴포넌트 자동 import (Nuxt auto-import)

// 인증 상태 확인
const authStore = useAuthStore()
const { isInitialized } = storeToRefs(authStore)
</script>

<style scoped>
.layout-wrapper {
  @apply min-h-screen flex flex-col bg-background-primary text-text-primary;
  font-family: var(--font-system);
}

.main-content {
  @apply flex-1 bg-background-primary;
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding-top: 0; /* Header가 sticky이므로 추가 padding 불필요 */
}

/* 페이지 콘텐츠를 위한 기본 컨테이너 */
.main-content :deep(.page-container) {
  @apply max-w-6xl mx-auto px-4 py-8;
}

/* 더 나은 스크롤 경험을 위한 스타일 */
html {
  scroll-behavior: smooth;
}

/* 포커스 링 개선 - Linear Design System */
*:focus-visible {
  @apply outline-2 outline-offset-2;
  outline-color: var(--color-primary-500);
}

/* 텍스트 선택 스타일 개선 - Linear Design System */
::selection {
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
}

::-moz-selection {
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
}

/* 모바일에서의 터치 피드백 개선 */
@media (hover: none) and (pointer: coarse) {
  button, 
  a, 
  [role="button"] {
    @apply active:scale-95 transition-transform duration-100;
  }
}

/* Linear Design System 다크 테마 강제 적용 */
.layout-wrapper {
  background-color: var(--color-bg-primary) !important;
  color: var(--color-text-primary) !important;
}
</style>