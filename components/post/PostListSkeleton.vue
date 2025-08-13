<!-- components/PostListSkeleton.vue -->
<template>
  <div class="bg-background-primary">
    <div
      v-for="i in count"
      :key="i"
      class="flex items-start py-4 px-0 border-b border-border-muted animate-pulse"
    >
      <div class="flex-1 min-w-0">
        <div class="h-4 bg-background-secondary rounded mb-2 w-3/4"></div>
        <div class="h-3 bg-background-secondary rounded mb-2 w-full"></div>
        <div class="h-3 bg-background-secondary rounded mb-2 w-2/3"></div>
        <div class="flex space-x-3 mt-2">
          <div class="h-3 bg-background-secondary rounded w-12"></div>
          <div class="h-3 bg-background-secondary rounded w-12"></div>
          <div class="h-3 bg-background-secondary rounded w-12"></div>
          <div class="h-3 bg-background-secondary rounded w-16"></div>
        </div>
      </div>
      <div class="ml-4 w-16 h-16 bg-background-secondary rounded"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number;
}

withDefaults(defineProps<Props>(), {
  count: 5,
});
</script>