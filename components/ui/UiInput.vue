<template>
  <div class="relative" :class="props.class || 'w-full'">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-text-secondary mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-status-error ml-1">*</span>
    </label>
    
    <div class="relative">
      <input
        ref="inputRef"
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :class="inputClasses"
        :value="modelValue"
        v-bind="$attrs"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <div v-if="$slots.suffix" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <slot name="suffix" />
      </div>
      
      <div v-if="$slots.prefix" class="absolute inset-y-0 left-0 flex items-center pl-3">
        <slot name="prefix" />
      </div>
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
interface InputProps {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autocomplete?: string
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const inputRef = ref<HTMLInputElement>()
const inputId = computed(() => `input-${Math.random().toString(36).substring(2, 9)}`)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value
  
  // 숫자만 허용하는 경우 (inputmode="numeric"이 설정된 경우)
  if (target.getAttribute('inputmode') === 'numeric') {
    // 숫자가 아닌 문자 제거
    value = value.replace(/[^0-9]/g, '')
    // 최대 길이 제한
    const maxLength = target.getAttribute('maxlength')
    if (maxLength && value.length > parseInt(maxLength)) {
      value = value.slice(0, parseInt(maxLength))
    }
    // 실제 입력값 업데이트
    target.value = value
  }
  
  const finalValue = props.type === 'number' ? Number(value) : value
  emit('update:modelValue', finalValue)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const inputClasses = computed(() => {
  const baseClasses = [
    'block',
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

  const slots = useSlots()
  const prefixPadding = slots.prefix ? ['pl-10'] : []
  const suffixPadding = slots.suffix ? ['pr-10'] : []

  return [
    ...baseClasses,
    ...stateClasses,
    ...sizeClasses[props.size],
    ...prefixPadding,
    ...suffixPadding,
    props.class
  ].filter(Boolean).join(' ')
})

// Focus method to expose to parent components
const focus = () => {
  inputRef.value?.focus()
}

// Expose focus method for parent components
defineExpose({
  focus
})
</script>