<!-- error.vue - Nuxt 3 Custom Error Page -->
<template>
  <div
    class="min-h-screen bg-background-primary flex items-center justify-center px-4"
  >
    <div class="max-w-lg w-full text-center">
      <!-- Error Icon -->
      <div class="mb-8">
        <div
          class="mx-auto w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mb-4"
        >
          <Icon :name="errorIcon" class="w-12 h-12" :class="errorIconColor" />
        </div>
      </div>

      <!-- Error Title -->
      <h1 class="text-3xl font-bold text-text-primary mb-4">
        {{ errorTitle }}
      </h1>

      <!-- Error Description -->
      <p class="text-lg text-text-secondary mb-8 leading-relaxed">
        {{ errorDescription }}
      </p>

      <!-- Error Details (개발 환경에서만 표시) -->
      <div v-if="isDev && props.error?.stack" class="mb-8">
        <details class="text-left">
          <summary
            class="text-sm text-text-tertiary hover:text-text-secondary cursor-pointer mb-2"
          >
            개발자 정보 (클릭하여 열기)
          </summary>
          <div
            class="bg-background-secondary border border-border-muted rounded-lg p-4"
          >
            <p class="text-xs text-text-tertiary mb-2">오류 상세:</p>
            <pre
              class="text-xs text-text-quaternary overflow-x-auto whitespace-pre-wrap break-words"
              >{{ props.error?.stack }}</pre
            >
          </div>
        </details>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <!-- Primary Action -->
        <button
          @click="handleClearError"
          class="inline-flex items-center justify-center px-6 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-background-primary"
        >
          <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
          다시 시도
        </button>

        <!-- Secondary Action -->
        <button
          @click="goHome"
          class="inline-flex items-center justify-center px-6 py-3 bg-background-secondary hover:bg-background-tertiary text-text-primary font-medium rounded-lg transition-colors border border-border-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-background-primary"
        >
          <Icon name="lucide:home" class="w-4 h-4 mr-2" />
          홈으로 돌아가기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

// Props 정의 (공식 문서 방식)
const props = defineProps({
  error: Object as () => NuxtError
})

// Environment check
const isDev = process.dev;

// 에러 페이지 레이아웃 설정
definePageMeta({
  layout: 'error'
});

// Page meta
useHead({
  title: `오류 ${props.error?.statusCode} - Secret Board`,
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

// Error 정보 계산
const errorTitle = computed(() => {
  switch (props.error?.statusCode) {
    case 400:
      return "잘못된 요청";
    case 401:
      return "인증이 필요합니다";
    case 403:
      return "접근이 거부되었습니다";
    case 404:
      return "페이지를 찾을 수 없습니다";
    case 429:
      return "너무 많은 요청";
    case 500:
      return "서버 오류가 발생했습니다";
    case 502:
      return "게이트웨이 오류";
    case 503:
      return "서비스를 사용할 수 없습니다";
    default:
      return "예상치 못한 오류가 발생했습니다";
  }
});

const errorDescription = computed(() => {
  if (
    props.error?.message &&
    props.error.message !== props.error.statusMessage
  ) {
    return props.error.message;
  }

  switch (props.error?.statusCode) {
    case 400:
      return "요청에 문제가 있습니다. 입력하신 정보를 확인해주세요.";
    case 401:
      return "로그인이 필요한 페이지입니다. 로그인 후 다시 시도해주세요.";
    case 403:
      return "이 페이지에 접근할 권한이 없습니다.";
    case 404:
      return "요청하신 페이지를 찾을 수 없습니다. URL을 확인하시거나 홈페이지로 돌아가세요.";
    case 429:
      return "너무 많은 요청을 보내셨습니다. 잠시 후 다시 시도해주세요.";
    case 500:
      return "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    case 502:
      return "게이트웨이 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    case 503:
      return "서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
    default:
      return "예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.";
  }
});

const errorIcon = computed(() => {
  switch (props.error?.statusCode) {
    case 400:
    case 401:
    case 403:
      return "lucide:shield-x";
    case 404:
      return "lucide:file-question";
    case 429:
      return "lucide:timer";
    case 500:
    case 502:
    case 503:
      return "lucide:server-crash";
    default:
      return "lucide:alert-triangle";
  }
});

const errorIconColor = computed(() => {
  switch (props.error?.statusCode) {
    case 400:
    case 401:
    case 403:
    case 429:
      return "text-accent-orange";
    case 404:
      return "text-accent-blue";
    case 500:
    case 502:
    case 503:
      return "text-accent-red";
    default:
      return "text-accent-orange";
  }
});

// Actions
const handleClearError = async () => {
  await clearError({ redirect: "/" });
};

const goHome = () => {
  navigateTo("/");
};



// SEO 및 접근성
onMounted(() => {
  // 오류 페이지 접근을 위한 포커스 설정
  const firstButton = document.querySelector("button");
  if (firstButton) {
    firstButton.focus();
  }
});
</script>

<style scoped>
/* 추가적인 스타일이 필요한 경우 여기에 작성 */
</style>
