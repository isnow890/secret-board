<!-- components/comments/molecules/CommentContent.vue -->
<template>
  <div class="comment-content" :class="computedClass">
    <!-- Main text content -->
    <CommentText
      :content="content"
      :is-deleted="isDeleted"
      :preview="preview"
      :preview-length="previewLength"
      class="mb-3"
    />

    <!-- Attachments section (if any) -->
    <div v-if="hasAttachments && !isDeleted" class="comment-attachments mt-2">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(attachment, index) in attachments"
          :key="index"
          class="attachment-item"
        >
          <!-- Image attachment -->
          <div v-if="isImageAttachment(attachment)" class="image-attachment">
            <img
              :src="attachment.url"
              :alt="attachment.filename"
              class="max-w-full max-h-32 rounded border border-border-muted cursor-pointer hover:opacity-80 transition-opacity"
              @click="$emit('attachment-click', attachment, index)"
            />
            <div class="text-xs text-text-tertiary mt-1 text-center">
              {{ attachment.filename }}
            </div>
          </div>

          <!-- File attachment -->
          <div
            v-else
            class="file-attachment flex items-center p-2 bg-background-secondary border border-border-muted rounded cursor-pointer hover:bg-background-tertiary transition-colors"
            @click="$emit('attachment-click', attachment, index)"
          >
            <Icon name="lucide:file" class="w-4 h-4 mr-2 text-text-tertiary" />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-text-primary truncate">
                {{ attachment.filename }}
              </div>
              <div class="text-xs text-text-tertiary">
                {{ formatFileSize(attachment.size) }}
              </div>
            </div>
            <Icon
              name="lucide:download"
              class="w-4 h-4 text-text-tertiary ml-2"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Edit indicator (if comment was edited) -->
    <!-- <div
      v-if="showEditIndicator && !isDeleted"
      class="comment-edit-indicator text-xs text-text-quaternary mt-2"
    >
      <Icon name="lucide:edit-3" class="w-3 h-3 inline mr-1" />
      수정됨 · {{ formatDate(updatedAt) }}
    </div> -->
  </div>
</template>

<script setup lang="ts">
import type { AttachedFile } from "~/types";

interface Props {
  /** Comment content text */
  content: string;
  /** Whether the comment is deleted */
  isDeleted?: boolean;
  /** Whether to show content in preview mode */
  preview?: boolean;
  /** Maximum characters for preview mode */
  previewLength?: number;
  /** Attached files */
  attachments?: AttachedFile[];
  /** Comment updated timestamp (for edit indicator) */
  updatedAt?: string;
  /** Comment created timestamp (to compare for edit indicator) */
  createdAt?: string;
  /** Additional CSS classes */
  class?: string;
}

interface Emits {
  (e: "attachment-click", attachment: AttachedFile, index: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isDeleted: false,
  preview: false,
  previewLength: 150,
  attachments: () => [],
});

const emit = defineEmits<Emits>();

// Computed properties
const computedClass = computed(() => {
  const classes = ["comment-content", props.class || ""].filter(Boolean);

  return classes.join(" ");
});

const hasAttachments = computed(() => {
  return props.attachments && props.attachments.length > 0;
});

const showEditIndicator = computed(() => {
  if (!props.updatedAt || !props.createdAt) {
    return false;
  }

  // Show edit indicator if updated time is significantly different from created time
  const created = new Date(props.createdAt).getTime();
  const updated = new Date(props.updatedAt).getTime();
  const diffInSeconds = Math.abs(updated - created) / 1000;

  // Show if difference is more than 30 seconds (to account for small timing differences)
  return diffInSeconds > 30;
});

// Utility functions
const isImageAttachment = (attachment: AttachedFile): boolean => {
  if (!attachment.type) {
    // Fallback to filename extension
    const ext = attachment.filename.toLowerCase().split(".").pop();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
  }
  return attachment.type.startsWith("image/");
};

const formatFileSize = (bytes: number): string => {
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 24) {
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }
    return `${diffInHours}시간 전`;
  } else {
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  }
};
</script>

<style scoped>
.comment-content {
  /* Base content styling */
}

/* Attachment grid layout */
.comment-attachments {
  /* Grid layout for multiple attachments */
}

.attachment-item {
  /* Individual attachment styling */
}

.image-attachment {
  @apply inline-block;
}

.image-attachment img {
  @apply block;
}

.file-attachment {
  @apply min-w-0 max-w-xs;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .image-attachment img {
    @apply max-h-24;
  }

  .file-attachment {
    @apply max-w-full;
  }
}

/* Edit indicator styling */
.comment-edit-indicator {
  @apply flex items-center;
}
</style>
