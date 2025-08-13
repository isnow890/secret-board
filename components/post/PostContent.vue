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
      
      <!-- 좋아요 버튼 (글 내용 바로 밑 왼쪽) -->
      <div class="mt-6 pt-4">
        <button
          @click="$emit('toggleLike')"
          :disabled="likePending"
          class="flex items-center space-x-2 px-4 py-2 rounded-lg border-transparent transition-all duration-200 hover:bg-interactive-hover"
          :class="[
            isLiked ? 'text-red-500' : 'text-text-tertiary hover:text-red-500',
            likePending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ]"
        >
          <Icon
            :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'"
            class="w-5 h-5"
            :class="[likePending ? 'animate-pulse' : '']"
          />
          <span class="font-medium">{{ formatNumber(displayLikeCount) }}</span>
        </button>
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
</style>
