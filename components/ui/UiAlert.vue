<template>
  <div :class="alertClasses" role="alert">
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0">
        <Icon :name="iconName" :class="iconClasses" />
      </div>
      
      <div class="flex-1 min-w-0">
        <h4 v-if="title" class="text-sm font-medium mb-1">
          {{ title }}
        </h4>
        
        <div class="text-sm">
          <slot>
            {{ message }}
          </slot>
        </div>
      </div>
      
      <UiButton
        v-if="closable"
        variant="ghost"
        size="sm"
        class="p-1 -mr-1 -mt-1"
        @click="$emit('close')"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  title?: string
  message?: string
  closable?: boolean
  class?: string
}

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'default',
  closable: false
})

defineEmits<{
  close: []
}>()

const iconName = computed(() => {
  const icons = {
    default: 'lucide:info',
    success: 'lucide:check-circle',
    warning: 'lucide:alert-triangle',
    error: 'lucide:alert-circle',
    info: 'lucide:info'
  }
  return icons[props.variant]
})

const iconClasses = computed(() => {
  const baseClasses = ['w-5', 'h-5']
  
  const variantClasses = {
    default: ['text-text-tertiary'],
    success: ['text-status-success'],
    warning: ['text-status-warning'],  
    error: ['text-status-error'],
    info: ['text-status-info']
  }
  
  return [...baseClasses, ...variantClasses[props.variant]].join(' ')
})

const alertClasses = computed(() => {
  const baseClasses = [
    'rounded-md',
    'border',
    'p-4',
    'transition-all',
    'duration-200'
  ]

  const variantClasses = {
    default: [
      'bg-background-tertiary',
      'border-border-muted',
      'text-text-primary'
    ],
    success: [
      'bg-status-success-bg',
      'border-status-success-border',
      'text-text-primary'
    ],
    warning: [
      'bg-status-warning-bg',
      'border-status-warning-border',
      'text-text-primary'
    ],
    error: [
      'bg-status-error-bg',
      'border-status-error-border',
      'text-text-primary'
    ],
    info: [
      'bg-status-info-bg',
      'border-status-info-border',
      'text-text-primary'
    ]
  }

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    props.class
  ].filter(Boolean).join(' ')
})
</script>