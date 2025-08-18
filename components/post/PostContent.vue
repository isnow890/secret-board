<!-- components/post/PostContent.vue -->
<template>
  <div class="space-y-6">
    <!-- 삭제된 게시글 메시지 -->
    <div v-if="post.is_deleted" class="text-center py-12">
      <Icon
        name="lucide:trash-2"
        class="w-16 h-16 mx-auto text-text-disabled opacity-60 mb-4"
      />
      <p class="text-lg text-text-disabled italic line-through">
        이 게시글은 삭제되었습니다.
      </p>
    </div>

    <!-- 본문 내용 (삭제되지 않은 경우만) -->
    <div v-else>
      <TiptapViewer :content="post.content" />
    </div>

    <!-- AI 요약 카드 (삭제되지 않은 경우만) -->
    <AiSummaryCard 
      v-if="!post.is_deleted && post.ai_summary && !aiSummaryGenerating"
      :summary="post.ai_summary"
      :generated-at="post.summary_generated_at"
    />
    
    <!-- AI 요약 생성 중 스켈레톤 -->
    <div 
      v-else-if="!post.is_deleted && aiSummaryGenerating"
      class="ai-summary-skeleton relative mt-4 p-4 rounded-xl border transition-all duration-300 bg-gradient-to-br from-purple-900/15 via-blue-900/10 to-indigo-900/15 border-purple-500/25 backdrop-blur-sm overflow-hidden"
      style="box-shadow: 0 8px 32px -12px rgba(168, 85, 247, 0.15);"
    >
      <!-- 카드 헤더 스켈레톤 -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
          <!-- AI 아이콘 위치 -->
          <div class="w-4 h-4 mr-2 rounded bg-purple-400/30 animate-pulse flex-shrink-0">
            <div class="w-full h-full rounded bg-purple-400/50 animate-pulse" 
                 style="animation: skeleton-glow 1.5s ease-in-out infinite;"></div>
          </div>
          <!-- "AI 요약" 텍스트 위치 -->
          <div class="h-4 bg-gradient-to-r from-purple-300/30 to-blue-300/30 rounded animate-pulse w-16"></div>
        </div>
        
        <!-- 생성 시간 위치 -->
        <div class="flex items-center">
          <div class="w-3 h-3 mr-1 rounded bg-purple-300/20 animate-pulse"></div>
          <div class="h-3 bg-purple-300/20 rounded animate-pulse w-12"></div>
        </div>
      </div>
      
      <!-- 요약 내용 스켈레톤 -->
      <div class="space-y-2 relative z-10">
        <div class="h-4 bg-text-primary/10 rounded animate-pulse w-full"></div>
        <div class="h-4 bg-text-primary/10 rounded animate-pulse w-11/12"></div>
        <div class="h-4 bg-text-primary/10 rounded animate-pulse w-4/5"></div>
      </div>
      
      <!-- 생성 중 표시 -->
      <div class="flex items-center justify-center mt-4 pt-3 border-t border-purple-500/10">
        <div class="flex items-center text-purple-300/70 text-sm">
          <div class="w-4 h-4 mr-2 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs opacity-70">AI가 요약을 생성중입니다...</span>
        </div>
      </div>
      
      <!-- 배경 반짝임 효과 스켈레톤 -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden" style="z-index: 1;">
        <div class="absolute w-1 h-1 bg-purple-400/15 rounded-full animate-pulse"
             style="top: 15%; left: 10%; animation-delay: 0s;"></div>
        <div class="absolute w-1.5 h-1.5 bg-blue-400/10 rounded-full animate-pulse"
             style="top: 25%; right: 20%; animation-delay: 1s;"></div>
        <div class="absolute w-0.5 h-0.5 bg-indigo-400/20 rounded-full animate-pulse"
             style="top: 60%; left: 25%; animation-delay: 2s;"></div>
        <div class="absolute w-1 h-1 bg-purple-300/10 rounded-full animate-pulse"
             style="bottom: 20%; right: 15%; animation-delay: 3s;"></div>
      </div>
    </div>

    <!-- 첨부파일 (삭제되지 않은 경우만) -->
    <div
      v-if="!post.is_deleted && post.hasAttachments"
      class="border-t border-border-muted pt-6"
    >
      <h3 class="text-lg font-semibold text-text-primary mb-4">
        첨부파일 ({{ post.attachmentCount }}개)
      </h3>

      <div class="space-y-2">
        <div
          v-for="file in post.attached_files"
          :key="file.url"
          class="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-border-muted"
        >
          <div class="flex items-center space-x-3">
            <Icon name="lucide:file" class="w-5 h-5 text-text-tertiary" />
            <div>
              <p class="text-sm font-medium text-text-primary">
                {{ file.filename }}
              </p>
              <p class="text-xs text-text-tertiary">
                {{ formatFileSize(file.size) }}
              </p>
            </div>
          </div>

          <a
            :href="file.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn text-sm"
          >
            <Icon name="lucide:download" class="w-4 h-4 mr-1" />
            다운로드
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from "~/types";
import TiptapViewer from "../editor/TiptapViewer.vue";

interface Props {
  post: Post;
  isLiked: boolean;
  displayLikeCount: number;
  likePending: boolean;
  aiSummaryGenerating?: boolean;
}

interface Emits {
  (e: "toggleLike"): void;
}

defineProps<Props>();
defineEmits<Emits>();

// 유틸리티 함수들
const { formatFileSize, formatNumber } = useUtils();
</script>

<style scoped>
/* 첨부파일 섹션 스타일링 */

/* AI 요약 스켈레톤 애니메이션 */
@keyframes skeleton-glow {
  0%, 100% { 
    opacity: 0.3; 
    filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.3)); 
  }
  50% { 
    opacity: 0.8; 
    filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.5)); 
  }
}

.ai-summary-skeleton {
  animation: skeleton-card-glow 2s ease-in-out infinite;
}

@keyframes skeleton-card-glow {
  0%, 100% { 
    box-shadow: 0 8px 32px -12px rgba(168, 85, 247, 0.15);
  }
  50% { 
    box-shadow: 0 12px 40px -12px rgba(168, 85, 247, 0.25);
  }
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .ai-summary-skeleton {
    margin: 0 0.5rem;
    padding: 0.75rem;
  }
  
  .ai-summary-skeleton .text-sm {
    font-size: 0.75rem;
  }
  
  .ai-summary-skeleton .text-xs {
    font-size: 0.625rem;
  }
}

/* 접근성 개선 - 애니메이션 감소 요청시 */
@media (prefers-reduced-motion: reduce) {
  .ai-summary-skeleton,
  .ai-summary-skeleton * {
    animation: none !important;
  }
  
  .ai-summary-skeleton .animate-pulse {
    opacity: 0.5;
  }
  
  .ai-summary-skeleton .animate-spin {
    animation: none !important;
    opacity: 0.6;
  }
}

/* 다크모드 최적화 */
@media (prefers-color-scheme: dark) {
  .ai-summary-skeleton {
    box-shadow: 
      0 8px 32px -12px rgba(168, 85, 247, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .ai-summary-skeleton {
    border-color: rgb(168 85 247);
    background-color: rgb(88 28 135 / 0.3);
  }
  
  .ai-summary-skeleton [class*="bg-purple-400"] {
    background-color: rgb(196 181 253);
  }
  
  .ai-summary-skeleton [class*="text-purple-300"] {
    color: rgb(233 213 255);
  }
}
</style>
