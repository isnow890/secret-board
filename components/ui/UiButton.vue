<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    v-bind="$attrs"
    @click="handleClick"
  >
    <UiSpinner v-if="loading" :size="spinnerSize" class="mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  class?: string;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  loading: false,
  type: "button",
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit("click", event);
  }
};

const buttonClasses = computed(() => {
  const baseClasses = [
    "inline-flex",
    "items-center",
    "justify-center",
    "whitespace-nowrap",
    "font-medium",
    "transition-all",
    "duration-200",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "disabled:pointer-events-none",
    "disabled:bg-gray-800",
    "disabled:text-gray-500",
    "disabled:border-gray-700",
    "border",
    "border-transparent",
  ];

  // Variant classes
  const variantClasses = {
    primary: [
      "bg-primary-500",
      "text-text-inverse",
      "hover:bg-primary-600",
      "focus-visible:ring-primary-500/50",
      "shadow-button",
    ],
    secondary: [
      "bg-transparent",
      "text-text-tertiary",
      "hover:bg-interactive-hover",
      "focus-visible:ring-primary-500/50",
      "border-transparent",
    ],
    ghost: [
      "bg-transparent",
      "text-text-primary",
      "hover:bg-interactive-hover",
      "focus-visible:ring-primary-500/50",
      "border-transparent",
    ],
  };

  // Size classes
  const sizeClasses = {
    sm: ["h-8", "px-3", "text-xs", "rounded-md"],
    md: ["h-9", "px-4", "text-sm", "rounded-md"],
    lg: ["h-10", "px-6", "text-base", "rounded-md"],
  };

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...sizeClasses[props.size],
    props.class,
  ]
    .filter(Boolean)
    .join(" ");
});

const spinnerSize = computed(() => {
  return {
    sm: "sm",
    md: "sm",
    lg: "md",
  }[props.size] as "sm" | "md";
});
</script>
