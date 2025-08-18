<!-- components/ai/AiSummaryCard.vue -->
<template>
  <div
    v-if="summary && summary.trim().length > 0"
    class="ai-summary-card"
  >
    <!-- 카드 헤더 -->
    <div class="summary-header">
      <div class="header-icon">
        <Icon 
          name="lucide:sparkles" 
          class="w-4 h-4 mr-2 ai-icon" 
        />
        <span class="header-title">AI 요약</span>
      </div>
      
      <div class="generation-time" v-if="generatedAt">
        <Icon 
          name="lucide:clock" 
          class="w-3 h-3 mr-1 opacity-70" 
        />
        <span class="text-xs opacity-70">{{ formatTime(generatedAt) }}</span>
      </div>
    </div>
    
    <!-- 요약 내용 -->
    <div class="summary-content">
      <p class="summary-text">{{ summary }}</p>
    </div>
    
    <!-- 카드 배경 효과 -->
    <div class="background-sparkles">
      <div v-for="i in 6" :key="`sparkle-bg-${i}`" 
           :class="`bg-sparkle bg-sparkle-${i}`"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  summary?: string | null;
  generatedAt?: string | null;
}

const props = defineProps<Props>();

// 시간 포맷팅 함수
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return '방금 전';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInMinutes < 1440) { // 24시간
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}시간 전`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}일 전`;
  }
};
</script>

<style scoped>
.ai-summary-card {
  @apply relative mt-4 p-4 rounded-xl border transition-all duration-300;
  @apply bg-gradient-to-br from-purple-900/15 via-blue-900/10 to-indigo-900/15;
  @apply border-purple-500/25 hover:border-purple-400/40;
  @apply backdrop-blur-sm;
  box-shadow: 0 8px 32px -12px rgba(168, 85, 247, 0.15);
  overflow: hidden;
}

.ai-summary-card:hover {
  @apply transform scale-[1.01];
  box-shadow: 0 12px 40px -12px rgba(168, 85, 247, 0.25);
}

.summary-header {
  @apply flex items-center justify-between mb-3;
}

.header-icon {
  @apply flex items-center;
}

.ai-icon {
  @apply text-purple-400;
  animation: ai-glow 3s ease-in-out infinite;
}

@keyframes ai-glow {
  0%, 100% { 
    filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.4)); 
  }
  50% { 
    filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.6)); 
  }
}

.header-title {
  @apply text-sm font-medium;
  @apply bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent;
  font-weight: 600;
}

.generation-time {
  @apply flex items-center text-purple-300/70;
}

.summary-content {
  @apply relative z-10;
}

.summary-text {
  @apply text-text-primary leading-relaxed;
  @apply text-sm sm:text-base;
  line-height: 1.6;
}

/* 배경 반짝임 효과 */
.background-sparkles {
  @apply absolute inset-0 pointer-events-none overflow-hidden;
  z-index: 1;
}

.bg-sparkle {
  @apply absolute rounded-full;
  animation: bg-sparkle-float 4s ease-in-out infinite;
}

.bg-sparkle-1 {
  @apply w-1 h-1 bg-purple-400/20;
  top: 15%;
  left: 10%;
  animation-delay: 0s;
}

.bg-sparkle-2 {
  @apply w-1.5 h-1.5 bg-blue-400/15;
  top: 25%;
  right: 20%;
  animation-delay: 1s;
}

.bg-sparkle-3 {
  @apply w-0.5 h-0.5 bg-indigo-400/25;
  top: 60%;
  left: 25%;
  animation-delay: 2s;
}

.bg-sparkle-4 {
  @apply w-1 h-1 bg-purple-300/15;
  bottom: 20%;
  right: 15%;
  animation-delay: 3s;
}

.bg-sparkle-5 {
  @apply w-0.5 h-0.5 bg-blue-300/20;
  top: 40%;
  right: 30%;
  animation-delay: 1.5s;
}

.bg-sparkle-6 {
  @apply w-1 h-1 bg-indigo-300/15;
  bottom: 40%;
  left: 15%;
  animation-delay: 2.5s;
}

@keyframes bg-sparkle-float {
  0%, 100% { 
    opacity: 0.2; 
    transform: translateY(0px) scale(1); 
  }
  50% { 
    opacity: 0.8; 
    transform: translateY(-8px) scale(1.2); 
  }
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .ai-summary-card {
    @apply mx-2 p-3;
  }
  
  .summary-header {
    @apply mb-2;
  }
  
  .header-title {
    @apply text-xs;
  }
  
  .generation-time span {
    @apply text-[10px];
  }
  
  .summary-text {
    @apply text-sm;
  }
}

/* 다크모드 최적화 */
@media (prefers-color-scheme: dark) {
  .ai-summary-card {
    box-shadow: 
      0 8px 32px -12px rgba(168, 85, 247, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  
  .ai-summary-card:hover {
    box-shadow: 
      0 12px 40px -12px rgba(168, 85, 247, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .ai-summary-card,
  .ai-icon,
  .bg-sparkle {
    animation: none !important;
  }
  
  .ai-summary-card:hover {
    transform: none !important;
  }
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .ai-summary-card {
    @apply border-purple-400 bg-purple-900/30;
  }
  
  .header-title {
    @apply text-purple-200;
    background: none;
  }
  
  .summary-text {
    @apply text-white;
  }
}
</style>