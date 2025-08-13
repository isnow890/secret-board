<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// 전역 에러 처리
const nuxtApp = useNuxtApp()

// Nuxt 전역 에러 핸들러 설정
nuxtApp.hook('app:error', (error) => {
  console.error('Global app error:', error)
})

// Vue 에러 핸들러 설정 (클라이언트 전용)
if (process.client) {
  nuxtApp.hook('vue:error', (error, instance, info) => {
    console.error('Vue error:', error, info)
  })
}
</script>

<style>
/* CSS Import - Linear Design System */
@import "~/assets/css/linear-theme.css";
</style>
