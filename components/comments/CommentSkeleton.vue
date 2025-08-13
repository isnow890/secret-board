<!-- components/CommentSkeleton.vue -->
<template>
  <div class="comment-skeleton bg-background-elevated border border-border-muted rounded-lg p-4 animate-pulse">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <!-- 사용자 아이콘 -->
        <div class="w-4 h-4 bg-background-secondary rounded"></div>
        <!-- 익명 텍스트 -->
        <div class="w-8 h-4 bg-background-secondary rounded"></div>
      </div>
      <!-- 시간 -->
      <div class="w-12 h-3 bg-background-secondary rounded"></div>
    </div>

    <!-- 내용 -->
    <div class="space-y-2 mb-3">
      <div class="h-4 bg-background-secondary rounded w-full"></div>
      <div class="h-4 bg-background-secondary rounded w-4/5"></div>
      <div class="h-4 bg-background-secondary rounded w-3/5"></div>
    </div>

    <!-- 액션 버튼들 -->
    <div class="flex items-center space-x-4">
      <!-- 좋아요 버튼 -->
      <div class="flex items-center space-x-1">
        <div class="w-4 h-4 bg-background-secondary rounded"></div>
        <div class="w-4 h-3 bg-background-secondary rounded"></div>
      </div>

      <!-- 답글 버튼 -->
      <div class="flex items-center space-x-1">
        <div class="w-4 h-4 bg-background-secondary rounded"></div>
        <div class="w-6 h-3 bg-background-secondary rounded"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 스켈레톤 컴포넌트는 props가 필요하지 않음
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
