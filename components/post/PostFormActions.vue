<!-- components/post/PostFormActions.vue -->
<template>
  <div class="flex items-center justify-end gap-2 pt-6">
    <UiButton
      type="button"
      variant="secondary"
      size="sm"
      :disabled="disabled || !canSaveDraft"
      @click="$emit('saveDraft')"
    >
      <Icon name="lucide:save" class="w-4 h-4 mr-2" />
      임시저장
    </UiButton>

    <UiButton
      v-if="hasSavedDraft"
      type="button"
      variant="secondary"
      size="sm"
      :disabled="disabled"
      @click="$emit('deleteDraft')"
      class="text-status-error hover:text-status-error border-status-error/20 hover:border-status-error/30 hover:bg-status-error/5"
    >
      <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
      임시저장 삭제
    </UiButton>

    <UiButton
      type="submit"
      variant="primary"
      size="sm"
      :loading="submitting"
      :disabled="disabled || !isFormValid"
    >
      <Icon v-if="!submitting" name="lucide:send" class="w-4 h-4 mr-2" />
      {{ submitting ? "저장 중..." : "게시하기" }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  canSaveDraft: boolean
  hasSavedDraft: boolean
  isFormValid: boolean
  submitting: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'saveDraft'): void
  (e: 'deleteDraft'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>