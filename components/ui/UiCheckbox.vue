<template>
  <div class="flex items-start gap-3">
    <div class="relative flex items-center">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="checked"
        :disabled="disabled"
        :required="required"
        :class="checkboxClasses"
        v-bind="$attrs"
        @change="handleChange"
      />
    </div>
    
    <div class="flex-1">
      <label
        :for="checkboxId"
        :class="[
          'block text-sm font-medium cursor-pointer',
          disabled ? 'text-text-disabled cursor-not-allowed' : 'text-text-primary'
        ]"
      >
        <slot>{{ label }}</slot>
      </label>
      
      <p v-if="description" class="text-sm text-text-secondary mt-1">
        {{ description }}
      </p>
      
      <p v-if="error" class="text-sm text-status-error mt-1">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CheckboxProps {
  modelValue?: boolean
  checked?: boolean
  label?: string
  description?: string
  error?: string
  disabled?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  size: 'md',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [event: Event]
}>()

const checkboxId = computed(() => `checkbox-${Math.random().toString(36).substring(2, 9)}`)

const checked = computed(() => {
  return props.modelValue ?? props.checked ?? false
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('change', event)
}

const checkboxClasses = computed(() => {
  const baseClasses = [
    'rounded',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-primary-500/50',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'cursor-pointer',
    'accent-primary-500' // 네이티브 체크박스 색상 설정
  ]

  const errorClasses = props.error
    ? ['focus:ring-status-error/50']
    : []

  const sizeClasses = {
    sm: ['w-4', 'h-4'],
    md: ['w-5', 'h-5'],
    lg: ['w-6', 'h-6']
  }

  return [
    ...baseClasses,
    ...errorClasses,
    ...sizeClasses[props.size],
    props.class
  ].filter(Boolean).join(' ')
})
</script>