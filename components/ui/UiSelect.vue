<template>
  <div class="relative">
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium text-text-secondary mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-status-error ml-1">*</span>
    </label>
    
    <div class="relative">
      <select
        :id="selectId"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        :value="modelValue"
        v-bind="$attrs"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        
        <template v-if="options">
          <option
            v-for="option in options"
            :key="getOptionValue(option)"
            :value="getOptionValue(option)"
          >
            {{ getOptionLabel(option) }}
          </option>
        </template>
        
        <slot v-else />
      </select>
      
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <Icon name="lucide:chevron-down" class="w-4 h-4 text-text-tertiary" />
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
interface Option {
  label: string
  value: string | number
  disabled?: boolean
}

interface SelectProps {
  modelValue?: string | number
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  options?: Option[] | string[] | number[]
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<SelectProps>(), {
  size: 'md',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const selectId = computed(() => `select-${Math.random().toString(36).substring(2, 9)}`)

const getOptionValue = (option: Option | string | number): string | number => {
  if (typeof option === 'object' && option !== null) {
    return option.value
  }
  return option
}

const getOptionLabel = (option: Option | string | number): string => {
  if (typeof option === 'object' && option !== null) {
    return option.label
  }
  return String(option)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  emit('update:modelValue', value)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const selectClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'bg-background-elevated',
    'text-text-primary',
    'border',
    'rounded',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500/50',
    'focus:border-primary-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'appearance-none',
    'pr-10'
  ]

  const stateClasses = props.error
    ? ['border-status-error', 'focus:border-status-error', 'focus:ring-status-error/50']
    : ['border-border-muted']

  const sizeClasses = {
    sm: ['px-3', 'py-2', 'text-sm'],
    md: ['px-3', 'py-2', 'text-base'],
    lg: ['px-4', 'py-3', 'text-lg']
  }

  return [
    ...baseClasses,
    ...stateClasses,
    ...sizeClasses[props.size],
    props.class
  ].filter(Boolean).join(' ')
})
</script>