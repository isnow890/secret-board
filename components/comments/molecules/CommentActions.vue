<!-- components/comments/molecules/CommentActions.vue -->
<template>
  <div
    class="comment-actions flex items-center justify-between"
    :class="computedClass"
  >
    <!-- Primary action buttons (like, reply) -->
    <div class="flex items-center space-x-4">
      <!-- Like button -->
      <CommentButton
        v-if="showLike && !isDeleted"
        type="like"
        :text="likeCount"
        :loading="liking"
        :disabled="isDeleted"
        :active="isLiked"
        :tooltip="isLiked ? '좋아요 취소' : '좋아요'"
        @click="$emit('like')"
      />

      <!-- Reply button -->
      <CommentButton
        v-if="showReply && !isDeleted"
        type="reply"
        :text="replyCountDisplay"
        :tooltip="'답글 작성'"
        @click="$emit('reply')"
      />
    </div>

    <!-- Secondary action buttons (edit, delete) -->
    <div
      v-if="showSecondaryActions && !isDeleted"
      class="flex items-center gap-1"
    >
      <!-- Edit button -->
      <CommentButton
        v-if="showEdit && !showEditForm"
        type="edit"
        :tooltip="'댓글 수정'"
        @click="$emit('edit')"
      />

      <!-- Delete button -->
      <CommentButton
        v-if="showDelete"
        type="delete"
        :loading="deleting"
        :tooltip="'댓글 삭제'"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Show like button */
  showLike?: boolean;
  /** Show reply button */
  showReply?: boolean;
  /** Show edit button */
  showEdit?: boolean;
  /** Show delete button */
  showDelete?: boolean;
  /** Show secondary actions (edit/delete) */
  showSecondaryActions?: boolean;
  /** Whether edit form is currently shown */
  showEditForm?: boolean;
  /** Whether comment is deleted */
  isDeleted?: boolean;
  /** Whether comment is liked */
  isLiked?: boolean;
  /** Like count */
  likeCount?: number;
  /** Reply count */
  replyCount?: number;
  /** Loading states */
  liking?: boolean;
  deleting?: boolean;
  /** Additional CSS classes */
  class?: string;
}

interface Emits {
  (e: "like"): void;
  (e: "reply"): void;
  (e: "edit"): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  showLike: true,
  showReply: true,
  showEdit: true,
  showDelete: true,
  showSecondaryActions: true,
  showEditForm: false,
  isDeleted: false,
  isLiked: false,
  likeCount: 0,
  replyCount: 0,
  liking: false,
  deleting: false,
});

const emit = defineEmits<Emits>();

// Computed properties
const computedClass = computed(() => {
  const classes = ["comment-actions", props.class || ""].filter(Boolean);

  return classes.join(" ");
});

const replyCountDisplay = computed(() => {
  const count = props.replyCount || 0;
  if (count > 0) {
    return `답글 (${count})`;
  }
  return "답글";
});
</script>

<style scoped>
.comment-actions {
  /* Base styling for actions container */
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .comment-actions {
    /* Mobile-specific spacing adjustments if needed */
  }

  .comment-actions .flex.items-center.space-x-4 {
    @apply space-x-3;
  }

  .comment-actions .flex.items-center.gap-1 {
    @apply gap-0.5;
  }
}
</style>
