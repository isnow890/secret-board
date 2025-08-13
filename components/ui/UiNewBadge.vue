<!-- components/ui/UiNewBadge.vue -->
<template>
  <component
    :is="variant === 'inline' ? 'span' : 'div'"
    :class="badgeClasses"
  >
    new
  </component>
</template>

<script setup lang="ts">
interface Props {
  /** 배지 스타일 변형 */
  variant?: 'inline' | 'badge'
  /** 크기 */
  size?: 'xs' | 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'badge',
  size: 'sm'
})

const badgeClasses = computed(() => {
  const base = 'font-medium flex-shrink-0'
  
  // 변형에 따른 스타일
  const variantClasses = {
    inline: 'inline-flex items-center px-1 py-0.5 rounded bg-text-tertiary text-background-primary -mt-0.5',
    badge: 'inline-flex items-center px-1.5 py-0.5 rounded-full bg-status-success text-white'
  }
  
  // 크기에 따른 스타일
  const sizeClasses = {
    xs: props.variant === 'inline' ? 'text-[10px]' : 'text-[10px]',
    sm: props.variant === 'inline' ? 'text-xs' : 'text-xs',
    md: props.variant === 'inline' ? 'text-sm' : 'text-sm'
  }
  
  return [
    base,
    variantClasses[props.variant],
    sizeClasses[props.size]
  ].join(' ')
})
</script>