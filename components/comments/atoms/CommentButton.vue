<!-- components/comments/atoms/CommentButton.vue -->
<template>
  <UiButton
    @click="handleClick"
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :class="computedClass"
    :title="tooltip"
  >
    <Icon
      v-if="icon"
      :name="icon"
      class="w-4 h-4"
      :class="[iconClass, loading ? 'animate-pulse' : '']"
    />
    <span v-if="hasText" :class="textClass">{{ text }}</span>
  </UiButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** Button type - determines styling and behavior */
  type: 'like' | 'reply' | 'edit' | 'delete' | 'submit' | 'cancel'
  /** Button text/label */
  text?: string | number
  /** Loading state */
  loading?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Tooltip text */
  tooltip?: string
  /** Additional CSS classes */
  class?: string
  /** Active state (for like button) */
  active?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  active: false,
})

const emit = defineEmits<Emits>()

// Button configuration based on type
const buttonConfig = computed(() => {
  switch (props.type) {
    case 'like':
      return {
        variant: 'ghost' as const,
        size: 'sm' as const,
        icon: props.active ? 'mdi:heart' : 'mdi:heart-outline',
        baseClass: 'transition-colors duration-200',
        activeClass: props.active ? 'text-red-500' : 'text-text-tertiary hover:text-red-500',
      }
    case 'reply':
      return {
        variant: 'ghost' as const,
        size: 'sm' as const,
        icon: 'lucide:message-circle',
        baseClass: '',
        activeClass: '',
      }
    case 'edit':
      return {
        variant: 'ghost' as const,
        size: 'sm' as const,
        icon: 'lucide:edit',
        baseClass: '',
        activeClass: '',
      }
    case 'delete':
      return {
        variant: 'ghost' as const,
        size: 'sm' as const,
        icon: 'lucide:trash-2',
        baseClass: 'text-status-error hover:text-status-error',
        activeClass: '',
      }
    case 'submit':
      return {
        variant: 'primary' as const,
        size: 'md' as const,
        icon: null,
        baseClass: '',
        activeClass: '',
      }
    case 'cancel':
      return {
        variant: 'secondary' as const,
        size: 'md' as const,
        icon: null,
        baseClass: '',
        activeClass: '',
      }
    default:
      return {
        variant: 'ghost' as const,
        size: 'sm' as const,
        icon: null,
        baseClass: '',
        activeClass: '',
      }
  }
})

// Computed properties
const variant = computed(() => buttonConfig.value.variant)
const size = computed(() => buttonConfig.value.size)
const icon = computed(() => buttonConfig.value.icon)

const computedClass = computed(() => {
  const classes = [
    buttonConfig.value.baseClass,
    buttonConfig.value.activeClass,
    props.disabled ? 'opacity-50' : '',
    props.loading ? 'opacity-70' : '',
    props.class || '',
  ].filter(Boolean)

  return classes.join(' ')
})

const iconClass = computed(() => {
  return props.text ? 'mr-1' : ''
})

const textClass = computed(() => {
  return props.type === 'reply' && typeof props.text === 'number' && props.text > 0 
    ? 'ml-1' 
    : ''
})

const hasText = computed(() => {
  return props.text !== undefined && props.text !== null && props.text !== ''
})

// Handlers
const handleClick = () => {
  if (!props.disabled && !props.loading) {
    emit('click')
  }
}

// Format text for display
const text = computed(() => {
  if (typeof props.text === 'number') {
    // Format numbers (e.g., for like count, reply count)
    if (props.text >= 1000) {
      return Math.floor(props.text / 100) / 10 + 'K'
    }
    return props.text.toString()
  }
  return props.text
})
</script>

<style scoped>
/* Additional styles if needed */
</style>