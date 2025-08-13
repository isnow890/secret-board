<!-- components/post/PostHeader.vue -->
<template>
  <header>
    <div class="mb-4">
      <h1
        class="text-xl md:text-3xl font-bold"
        :class="
          post.is_deleted
            ? 'text-text-tertiary italic line-through'
            : 'text-text-primary'
        "
      >
        {{ post.is_deleted ? "삭제된 게시글입니다" : post.title }}
      </h1>
    </div>

    <!-- 메타 정보 -->
    <div
      class="flex items-center justify-between text-sm pb-4 border-b border-border-muted"
      :class="post.is_deleted ? 'text-text-disabled' : 'text-text-tertiary'"
    >
      <div class="flex items-center space-x-6">
        <span class="flex items-center space-x-1">
          <Icon name="lucide:user" class="w-4 h-4" />
          <span>{{ post.is_deleted ? "익명" : post.nickname || "익명" }}</span>
        </span>
        <span class="flex items-center space-x-1">
          <Icon name="lucide:eye" class="w-4 h-4" />
          <span>{{ formatNumber(post.view_count || 0) }}</span>
        </span>

        <span class="flex items-center space-x-1">
          <Icon name="lucide:message-circle" class="w-4 h-4" />
          <span>{{ formatNumber(post.comment_count || 0) }}</span>
        </span>
      </div>

      <time :datetime="post.created_at || ''">
        {{ formatDate(post.created_at || "") }}
      </time>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Post } from "~/types";

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
const { formatNumber, formatDate } = useUtils();
</script>
