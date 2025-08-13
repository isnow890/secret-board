<template>
  <section :class="heroClasses">
    <div class="container mx-auto px-6">
      <div class="flex flex-col lg:flex-row items-center gap-12">
        <!-- Content -->
        <div :class="contentClasses">
          <div v-if="eyebrow" class="mb-4">
            <span class="text-sm font-medium text-primary-400 bg-primary-950 px-3 py-1 rounded-full">
              {{ eyebrow }}
            </span>
          </div>
          
          <h1 :class="titleClasses">
            <slot name="title">
              {{ title }}
            </slot>
          </h1>
          
          <p v-if="subtitle || $slots.subtitle" :class="subtitleClasses">
            <slot name="subtitle">
              {{ subtitle }}
            </slot>
          </p>
          
          <div v-if="$slots.actions" class="mt-8 flex flex-col sm:flex-row gap-4">
            <slot name="actions" />
          </div>
        </div>
        
        <!-- Visual -->
        <div v-if="$slots.visual" :class="visualClasses">
          <slot name="visual" />
        </div>
      </div>
    </div>
    
    <!-- Background decoration -->
    <div v-if="showBackground" class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-5" />
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500 rounded-full mix-blend-multiply filter blur-xl opacity-5" />
    </div>
  </section>
</template>

<script setup lang="ts">
interface HeroProps {
  title?: string
  subtitle?: string
  eyebrow?: string
  variant?: 'default' | 'centered' | 'minimal'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBackground?: boolean
  class?: string
}

const props = withDefaults(defineProps<HeroProps>(), {
  variant: 'default',
  size: 'lg',
  showBackground: true
})

const heroClasses = computed(() => {
  const baseClasses = [
    'relative',
    'overflow-hidden'
  ]

  const variantClasses = {
    default: ['py-20', 'lg:py-32'],
    centered: ['py-20', 'lg:py-32', 'text-center'],
    minimal: ['py-12', 'lg:py-20']
  }

  const sizeClasses = {
    sm: ['min-h-[400px]'],
    md: ['min-h-[500px]'],
    lg: ['min-h-[600px]'],
    xl: ['min-h-[700px]']
  }

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...sizeClasses[props.size],
    props.class
  ].filter(Boolean).join(' ')
})

const contentClasses = computed(() => {
  const baseClasses = ['flex-1', 'z-10', 'relative']
  
  if (props.variant === 'centered') {
    return [...baseClasses, 'text-center', 'mx-auto', 'max-w-4xl'].join(' ')
  }
  
  return baseClasses.join(' ')
})

const titleClasses = computed(() => {
  const baseClasses = [
    'font-bold',
    'text-text-primary',
    'leading-tight',
    'tracking-tight'
  ]

  const sizeClasses = {
    sm: ['text-3xl', 'lg:text-4xl'],
    md: ['text-4xl', 'lg:text-5xl'],
    lg: ['text-5xl', 'lg:text-6xl'],
    xl: ['text-6xl', 'lg:text-7xl']
  }

  return [
    ...baseClasses,
    ...sizeClasses[props.size]
  ].join(' ')
})

const subtitleClasses = computed(() => {
  const baseClasses = [
    'text-text-secondary',
    'leading-relaxed'
  ]

  const sizeClasses = {
    sm: ['text-base', 'lg:text-lg', 'mt-4'],
    md: ['text-lg', 'lg:text-xl', 'mt-4'],
    lg: ['text-xl', 'lg:text-2xl', 'mt-6'],
    xl: ['text-2xl', 'lg:text-3xl', 'mt-6']
  }

  const maxWidthClasses = props.variant === 'centered' 
    ? ['max-w-2xl', 'mx-auto']
    : ['max-w-2xl']

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...maxWidthClasses
  ].join(' ')
})

const visualClasses = computed(() => {
  const baseClasses = ['flex-1', 'z-10', 'relative']
  
  if (props.variant === 'centered') {
    return [...baseClasses, 'mt-12'].join(' ')
  }
  
  return baseClasses.join(' ')
})
</script>