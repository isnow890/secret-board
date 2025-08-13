<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'default',
  size: 'md'
})

const badgeClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-full',
    'transition-all',
    'duration-200'
  ]

  const variantClasses = {
    default: [
      'bg-background-tertiary',
      'text-text-primary',
      'border',
      'border-border-muted'
    ],
    success: [
      'bg-status-success-bg',
      'text-status-success',
      'border',
      'border-status-success-border'
    ],
    warning: [
      'bg-status-warning-bg',
      'text-status-warning',
      'border',
      'border-status-warning-border'
    ],
    error: [
      'bg-status-error-bg',
      'text-status-error',
      'border',
      'border-status-error-border'
    ],
    info: [
      'bg-status-info-bg',
      'text-status-info',
      'border',
      'border-status-info-border'
    ],
    outline: [
      'bg-transparent',
      'text-text-primary',
      'border',
      'border-border-strong'
    ]
  }

  const sizeClasses = {
    sm: ['px-2', 'py-1', 'text-xs', 'min-h-[20px]'],
    md: ['px-3', 'py-1', 'text-sm', 'min-h-[24px]'],
    lg: ['px-4', 'py-2', 'text-base', 'min-h-[32px]']
  }

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...sizeClasses[props.size],
    props.class
  ].filter(Boolean).join(' ')
})
</script>