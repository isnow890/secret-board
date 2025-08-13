<template>
  <div class="relative">
    <label
      v-if="label"
      :for="textareaId"
      class="block text-sm font-medium text-text-secondary mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-status-error ml-1">*</span>
    </label>
    
    <textarea
      :id="textareaId"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :rows="rows"
      :cols="cols"
      :maxlength="maxlength"
      :class="textareaClasses"
      :value="modelValue"
      v-bind="$attrs"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    
    <div
      v-if="showCharCount && maxlength"
      class="absolute bottom-2 right-2 text-xs text-text-tertiary"
    >
      {{ currentLength }}/{{ maxlength }}
    </div>
    
    <p
      v-if="error || hint"
      :class="[
        'mt-2 text-sm',
        error ? 'text-status-error' : 'text-text-tertiary'
      ]"
    >
      {{ error || hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface TextareaProps {
  modelValue?: string
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  rows?: number
  cols?: number
  maxlength?: number
  showCharCount?: boolean
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<TextareaProps>(), {
  rows: 3,
  disabled: false,
  readonly: false,
  required: false,
  showCharCount: false,
  resize: 'vertical',
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const textareaId = computed(() => `textarea-${Math.random().toString(36).substring(2, 9)}`)

const currentLength = computed(() => {
  return props.modelValue?.length ?? 0
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const textareaClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'bg-background-elevated',
    'text-text-primary',
    'border',
    'rounded',
    'transition-all',
    'duration-200',
    'placeholder:text-text-tertiary',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500/50',
    'focus:border-primary-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'readonly:bg-background-tertiary',
    'readonly:cursor-default'
  ]

  const stateClasses = props.error
    ? ['border-status-error', 'focus:border-status-error', 'focus:ring-status-error/50']
    : ['border-border-strong']

  const sizeClasses = {
    sm: ['px-3', 'py-2', 'text-sm'],
    md: ['px-3', 'py-2', 'text-base'],
    lg: ['px-4', 'py-3', 'text-lg']
  }

  const resizeClasses = {
    none: ['resize-none'],
    both: ['resize'],
    horizontal: ['resize-x'],
    vertical: ['resize-y']
  }

  return [
    ...baseClasses,
    ...stateClasses,
    ...sizeClasses[props.size],
    ...resizeClasses[props.resize],
    props.class
  ].filter(Boolean).join(' ')
})
</script>