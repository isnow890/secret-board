<!-- components/comments/atoms/CommentTimestamp.vue -->
<template>
  <time
    :datetime="isoDateTime"
    class="comment-timestamp"
    :class="computedClass"
    :title="fullDateTime"
  >
    {{ displayTime }}
  </time>
</template>

<script setup lang="ts">
interface Props {
  /** ISO datetime string */
  datetime: string
  /** Display format: 'relative' | 'absolute' | 'smart' */
  format?: 'relative' | 'absolute' | 'smart'
  /** Additional CSS classes */
  class?: string
  /** Whether to show seconds in relative time */
  showSeconds?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'relative',
  showSeconds: false,
})

// Computed properties
const computedClass = computed(() => {
  const classes = [
    'text-xs text-text-quaternary',
    props.class || '',
  ].filter(Boolean)

  return classes.join(' ')
})

const isoDateTime = computed(() => {
  return props.datetime
})

const fullDateTime = computed(() => {
  const date = new Date(props.datetime)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const displayTime = computed(() => {
  const date = new Date(props.datetime)
  
  if (!date || isNaN(date.getTime())) {
    return '날짜 오류'
  }

  switch (props.format) {
    case 'absolute':
      return formatAbsolute(date)
    case 'smart':
      return formatSmart(date)
    case 'relative':
    default:
      return formatRelative(date)
  }
})

// Format functions
const formatRelative = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSeconds < 1) {
    return "방금 전"
  } else if (diffInSeconds < 60) {
    return props.showSeconds ? `${diffInSeconds}초 전` : "방금 전"
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`
  } else {
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    })
  }
}

const formatAbsolute = (date: Date): string => {
  return date.toLocaleDateString("ko-KR", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatSmart = (date: Date): string => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  // Show relative time for recent comments (within 24 hours)
  if (diffInHours < 24) {
    return formatRelative(date)
  } else {
    return formatAbsolute(date)
  }
}

// Reactive time updates for relative format
let intervalId: NodeJS.Timeout | null = null

const updateInterval = () => {
  if (props.format === 'relative' || props.format === 'smart') {
    // Update every minute for relative times
    intervalId = setInterval(() => {
      // Force reactivity by accessing the computed
      displayTime.value
    }, 60000)
  }
}

onMounted(() => {
  if (process.client) {
    updateInterval()
  }
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

// Re-setup interval when format changes
watch(() => props.format, () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (process.client) {
    updateInterval()
  }
})
</script>

<style scoped>
.comment-timestamp {
  /* Base timestamp styling */
  cursor: default;
}

/* Hover effect to show full datetime */
.comment-timestamp:hover {
  @apply text-text-tertiary;
}
</style>