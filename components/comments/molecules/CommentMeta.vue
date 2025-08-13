<!-- components/comments/molecules/CommentMeta.vue -->
<template>
  <div class="comment-meta flex items-start justify-between" :class="computedClass">
    <!-- Author information and badges -->
    <div class="flex items-center space-x-2 flex-wrap">
      <CommentAuthor
        :nickname="nickname"
        :is-author="isAuthor"
        :is-new="isNew"
        :depth="depth"
        :max-nickname-length="maxNicknameLength"
      />
      
      <!-- Reply context for nested comments -->
      <div v-if="depth > 0 && parentNickname" class="flex items-center space-x-1 text-text-quaternary">
        <Icon name="lucide:reply" class="w-3 h-3" />
        <span class="text-xs">{{ parentNickname }}님에 대한 답글</span>
      </div>
    </div>

    <!-- Timestamp -->
    <CommentTimestamp
      :datetime="createdAt"
      :format="timeFormat"
      :show-seconds="showSeconds"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Author nickname */
  nickname?: string
  /** Whether this is the post author */
  isAuthor?: boolean
  /** Comment creation datetime */
  createdAt: string
  /** Reply depth (0 = top level, 1+ = nested) */
  depth?: number
  /** Parent comment author nickname (for replies) */
  parentNickname?: string
  /** Time display format */
  timeFormat?: 'relative' | 'absolute' | 'smart'
  /** Show seconds in relative time */
  showSeconds?: boolean
  /** Maximum nickname length for display */
  maxNicknameLength?: number
  /** Additional CSS classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  isAuthor: false,
  depth: 0,
  timeFormat: 'relative',
  showSeconds: false,
  maxNicknameLength: 20,
})

// Computed properties
const computedClass = computed(() => {
  const classes = [
    'comment-meta',
    props.class || '',
  ].filter(Boolean)

  return classes.join(' ')
})

const isNew = computed(() => {
  // Check if comment is new (within 6 hours)
  const created = new Date(props.createdAt).getTime()
  const now = Date.now()
  const sixHoursMs = 6 * 60 * 60 * 1000
  return now - created <= sixHoursMs
})
</script>

<style scoped>
.comment-meta {
  /* Base styling for meta information */
  margin-bottom: 12px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .comment-meta {
    margin-bottom: 8px;
  }
  
  /* Stack author and timestamp vertically on very small screens if needed */
  .comment-meta {
    @apply flex-col items-start space-x-0 space-y-1;
  }
  
  .comment-meta > div:first-child {
    @apply w-full;
  }
}

/* Ensure proper alignment */
.comment-meta .comment-author {
  @apply flex-1;
}

.comment-meta .comment-timestamp {
  @apply flex-shrink-0;
}
</style>