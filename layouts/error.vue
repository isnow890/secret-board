<template>
  <div class="error-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
// 에러 페이지 전용 레이아웃
</script>

<style scoped>
.error-layout {
  min-height: 100vh;
  width: 100%;
}
</style>