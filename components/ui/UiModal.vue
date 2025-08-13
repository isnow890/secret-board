<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="modelValue"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click="handleBackdropClick"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-background-overlay" />
          
          <!-- Modal -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="modelValue"
              :class="modalClasses"
              role="dialog"
              aria-modal="true"
              :aria-labelledby="titleId"
              @click.stop
            >
              <!-- Header -->
              <div v-if="$slots.header || title || showClose" class="modal-header">
                <div class="flex-1">
                  <slot name="header">
                    <h3 v-if="title" :id="titleId" class="text-lg font-semibold text-text-primary">
                      {{ title }}
                    </h3>
                    <p v-if="subtitle" class="text-sm text-text-secondary mt-1">
                      {{ subtitle }}
                    </p>
                  </slot>
                </div>
                
                <UiButton
                  v-if="showClose"
                  variant="ghost"
                  size="sm"
                  class="ml-4 p-2"
                  @click="close"
                >
                  <Icon name="lucide:x" class="w-4 h-4" />
                </UiButton>
              </div>
              
              <!-- Content -->
              <div class="modal-content">
                <slot />
              </div>
              
              <!-- Footer -->
              <div v-if="$slots.footer" class="modal-footer">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
interface ModalProps {
  modelValue: boolean
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  closeOnBackdrop?: boolean
  class?: string
}

const props = withDefaults(defineProps<ModalProps>(), {
  size: 'md',
  showClose: true,
  closeOnBackdrop: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const titleId = computed(() => `modal-title-${Math.random().toString(36).substring(2, 9)}`)

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const modalClasses = computed(() => {
  const baseClasses = [
    'relative',
    'bg-background-secondary',
    'rounded-lg',
    'shadow-xl',
    'border',
    'border-border-muted',
    'max-h-[90vh]',
    'overflow-hidden',
    'flex',
    'flex-col'
  ]

  const sizeClasses = {
    sm: ['w-full', 'max-w-sm', 'mx-4'],
    md: ['w-full', 'max-w-md', 'mx-4'],
    lg: ['w-full', 'max-w-lg', 'mx-4'],
    xl: ['w-full', 'max-w-2xl', 'mx-4'],
    full: ['w-[95vw]', 'h-[95vh]', 'max-w-none']
  }

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    props.class
  ].filter(Boolean).join(' ')
})

// Close modal on escape key
onMounted(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue) {
      close()
    }
  }
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})

// Prevent body scroll when modal is open (client-side only)
if (process.client) {
  watchEffect(() => {
    if (props.modelValue) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  })
}
</script>

<style scoped>
.modal-header {
  @apply flex items-start p-6 pb-4 border-b border-border-muted;
}

.modal-content {
  @apply flex-1 p-6 overflow-y-auto;
}

.modal-footer {
  @apply p-6 pt-4 border-t border-border-muted flex gap-3 justify-end;
}
</style>