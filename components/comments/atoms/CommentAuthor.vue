<!-- components/comments/atoms/CommentAuthor.vue -->
<template>
  <div
    class="comment-author flex items-center space-x-1"
    :class="computedClass"
  >
    <!-- User icon -->
    <Icon name="lucide:user" class="w-4 h-4 text-text-tertiary flex-shrink-0" />

    <!-- Nickname -->
    <span class="text-sm font-medium text-text-tertiary" :title="fullNickname">
      {{ displayNickname }}
    </span>

    <!-- Author badge -->
    <UiBadge v-if="isAuthor" variant="info" size="sm" class="flex-shrink-0">
      작성자
    </UiBadge>

    <!-- New badge (6시간 이내) -->
    <UiNewBadge v-if="isNew" variant="badge" size="xs" class="flex-shrink-0" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Author nickname */
  nickname?: string;
  /** Whether this is the post author */
  isAuthor?: boolean;
  /** Whether this is a new comment (within 6 hours) */
  isNew?: boolean;
  /** Reply depth (0 = top level, 1+ = nested) */
  depth?: number;
  /** Additional CSS classes */
  class?: string;
  /** Maximum nickname length for display */
  maxNicknameLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isAuthor: false,
  isNew: false,
  depth: 0,
  maxNicknameLength: 20,
});

// Computed properties
const computedClass = computed(() => {
  const classes = ["comment-author", props.class || ""].filter(Boolean);

  return classes.join(" ");
});

const fullNickname = computed(() => {
  return props.nickname || (props.isAuthor ? "글쓴이" : "익명");
});

const displayNickname = computed(() => {
  const nickname = fullNickname.value;

  if (nickname.length > props.maxNicknameLength) {
    return nickname.substring(0, props.maxNicknameLength - 3) + "...";
  }

  return nickname;
});
</script>

<style scoped>
.comment-author {
  /* Base styling for author display */
}

/* Ensure proper spacing and alignment */
.comment-author .ui-badge {
  /* Badge specific styling if needed */
}

/* Handle very long nicknames */
.comment-author span[title] {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .comment-author span[title] {
    max-width: 120px;
  }
}
</style>
