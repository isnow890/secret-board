<!-- components/post/PostDetailActions.vue -->
<template>
  <div class="flex items-center justify-between mb-8">
    <button class="btn btn-secondary" @click="$emit('goBack')">
      <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
      목록
    </button>

    <div class="flex items-center space-x-2">
      <UiButton
        v-if="showActions && !isDeleted"
        variant="secondary"
        size="sm"
        @click="$emit('edit')"
      >
        <Icon name="lucide:edit" class="w-4 h-4" />
      </UiButton>

      <UiButton
        v-if="showActions && !isDeleted"
        variant="secondary"
        size="sm"
        class="text-status-error hover:text-status-error border-status-error/20 hover:border-status-error/30 hover:bg-status-error/5"
        @click="$emit('delete')"
      >
        <Icon name="lucide:trash-2" class="w-4 h-4" />
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showActions?: boolean;
  isDeleted?: boolean;
}

interface Emits {
  (e: "goBack"): void;
  (e: "edit"): void;
  (e: "delete"): void;
}

withDefaults(defineProps<Props>(), {
  showActions: true,
  isDeleted: false,
});

defineEmits<Emits>();
</script>
