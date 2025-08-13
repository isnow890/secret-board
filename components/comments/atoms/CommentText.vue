<!-- components/comments/atoms/CommentText.vue -->
<template>
  <div class="comment-text" :class="computedClass">
    <p 
      class="leading-relaxed whitespace-pre-wrap"
      :class="textClass"
      v-html="processedContent"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Comment content text */
  content: string
  /** Whether the comment is deleted */
  isDeleted?: boolean
  /** Additional CSS classes */
  class?: string
  /** Whether to limit text length for preview */
  preview?: boolean
  /** Maximum characters for preview mode */
  previewLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  isDeleted: false,
  preview: false,
  previewLength: 150,
})

// Computed classes
const computedClass = computed(() => {
  const classes = [
    'comment-text',
    props.class || '',
  ].filter(Boolean)

  return classes.join(' ')
})

const textClass = computed(() => {
  if (props.isDeleted) {
    return 'text-text-tertiary italic line-through'
  }
  return 'text-text-primary'
})

// Process content for display
const processedContent = computed(() => {
  let content = props.content

  // Handle deleted comments
  if (props.isDeleted) {
    return '삭제된 댓글입니다'
  }

  // Handle empty content
  if (!content || !content.trim()) {
    return ''
  }

  // Apply preview truncation if needed
  if (props.preview && content.length > props.previewLength) {
    content = content.substring(0, props.previewLength).trim() + '...'
  }

  // Basic HTML sanitization - remove dangerous elements
  content = sanitizeHtml(content)

  // Convert line breaks to HTML if needed
  content = content.replace(/\n/g, '<br>')

  return content
})

// Basic HTML sanitization function
const sanitizeHtml = (html: string): string => {
  let cleaned = html

  // Remove dangerous script tags
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove iframe tags
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // Remove event handlers (onclick, onload, etc.)
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove javascript: URLs
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
  
  return cleaned
}
</script>

<style scoped>
.comment-text {
  /* Base text styling */
}

/* Ensure proper line height and spacing */
.comment-text p {
  margin: 0;
  word-wrap: break-word;
  word-break: break-word;
}

/* Handle long URLs and text */
.comment-text :deep(a) {
  @apply text-accent-blue hover:text-accent-blue/80 underline;
  word-break: break-all;
}

/* Style for inline code if present */
.comment-text :deep(code) {
  @apply bg-background-secondary px-1 py-0.5 rounded text-sm font-mono;
}

/* Style for bold text */
.comment-text :deep(strong) {
  @apply font-semibold;
}

/* Style for italic text */
.comment-text :deep(em) {
  @apply italic;
}
</style>