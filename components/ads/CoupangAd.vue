<!-- components/ads/CoupangAd.vue -->
<template>
  <div>
    <div class="ad-container" ref="adContainer">
      <iframe
        :src="src"
        :width="typeof width === 'string' ? '100%' : (width ?? iframeWidth)"
        :height="height"
        frameborder="0"
        scrolling="no"
        referrerpolicy="unsafe-url"
        browsingtopics
        class="rounded-lg"
      >
      </iframe>
    </div>
    <div class="text-xs text-text-tertiary text-center mt-2 opacity-70">
      쿠팡 파트너스 활동의 일환으로 이에 따른 일정 수수료를 제공받습니다.
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string;
    height?: number;
    width?: number | string;
  }>(),
  {
    height: 100,
    width: 680,
  }
);

const adContainer = ref<HTMLDivElement | null>(null);
const iframeWidth = ref(680);

onMounted(() => {
  updateWidth();
  window.addEventListener("resize", updateWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});

function updateWidth() {
  if (adContainer.value) {
    // width가 "100%"인 경우 컨테이너 전체 너비 사용, 아니면 기존 로직 사용
    if (props.width === "100%") {
      iframeWidth.value = adContainer.value.offsetWidth;
    } else {
      iframeWidth.value = Math.min(680, adContainer.value.offsetWidth);
    }
  }
}
</script>

<style scoped>
.ad-container {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>