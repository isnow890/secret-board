<!-- components/Toast.vue -->
<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <Transition v-for="toast in toasts" :key="toast.id" name="toast" appear>
      <div class="min-w-[20rem] max-w-md w-auto shadow-lg pointer-events-auto">
        <UiAlert
          :variant="toast.variant || 'default'"
          :title="toast.title"
          :message="toast.description"
          closable
          @close="remove(toast.id)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
