<template>
  <div class="w-full">
    <div v-if="showLabel" class="flex justify-between items-center mb-2">
      <span class="text-sm font-medium text-text-primary">{{ label }}</span>
      <span class="text-sm text-text-secondary">{{ displayValue }}</span>
    </div>
    
    <div :class="trackClasses">
      <div
        :class="barClasses"
        :style="{ width: `${percentage}%` }"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="value"
        role="progressbar"
      >
        <div v-if="animated" class="progress-animation" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ProgressProps {
  value: number
  max?: number
  min?: number
  label?: string
  showValue?: boolean
  showPercentage?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  class?: string
}

const props = withDefaults(defineProps<ProgressProps>(), {
  max: 100,
  min: 0,
  variant: 'default',
  size: 'md',
  showValue: true,
  showPercentage: false,
  animated: false
})

const percentage = computed(() => {
  const normalizedValue = Math.max(props.min, Math.min(props.max, props.value))
  return ((normalizedValue - props.min) / (props.max - props.min)) * 100
})

const showLabel = computed(() => {
  return props.label || props.showValue || props.showPercentage
})

const displayValue = computed(() => {
  if (props.showPercentage) {
    return `${Math.round(percentage.value)}%`
  }
  if (props.showValue) {
    return `${props.value}/${props.max}`
  }
  return ''
})

const trackClasses = computed(() => {
  const baseClasses = [
    'w-full',
    'bg-background-tertiary',
    'rounded-full',
    'overflow-hidden',
    'border',
    'border-border-muted'
  ]

  const sizeClasses = {
    sm: ['h-1'],
    md: ['h-2'],
    lg: ['h-3']
  }

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    props.class
  ].filter(Boolean).join(' ')
})

const barClasses = computed(() => {
  const baseClasses = [
    'h-full',
    'transition-all',
    'duration-300',
    'ease-out',
    'relative',
    'overflow-hidden'
  ]

  const variantClasses = {
    default: ['bg-primary-500'],
    success: ['bg-status-success'],
    warning: ['bg-status-warning'],
    error: ['bg-status-error'],
    info: ['bg-status-info']
  }

  return [
    ...baseClasses,
    ...variantClasses[props.variant]
  ].filter(Boolean).join(' ')
})
</script>

<style scoped>
.progress-animation {
  @apply absolute inset-0;
  background-color: rgba(255, 255, 255, 0.03);
  background-image: linear-gradient(
    45deg,
    transparent 25%,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 50%,
    transparent 75%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 20px 20px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 0;
  }
}
</style>