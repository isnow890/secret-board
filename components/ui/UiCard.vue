<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-text-primary">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-sm text-text-secondary mt-1">
          {{ subtitle }}
        </p>
      </slot>
    </div>

    <div class="card-content">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface CardProps {
  title?: string;
  subtitle?: string;
  variant?: "default" | "outlined" | "elevated";
  size?: "sm" | "md" | "lg";
  class?: string;
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: "default",
  size: "md",
});

const cardClasses = computed(() => {
  const baseClasses = [
    "bg-background-elevated",
    "rounded-md",
    "transition-all",
    "duration-200",
  ];

  const variantClasses = {
    default: ["border", "border-border-muted"],
    outlined: ["border-2", "border-border-strong", "bg-transparent"],
    elevated: ["shadow-md", "border", "border-border-muted"],
  };

  const sizeClasses = {
    sm: ["p-4"],
    md: ["p-6"],
    lg: ["p-8"],
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
</script>

<style scoped>
.card-header {
  @apply mb-4 pb-4 border-b border-border-muted;
}

.card-header:last-child {
  @apply mb-0 pb-0 border-b-0;
}

.card-content {
  @apply flex-1;
}

.card-footer {
  @apply mt-4 pt-4 border-t border-border-muted;
}

.card-footer:first-child {
  @apply mt-0 pt-0 border-t-0;
}
</style>
