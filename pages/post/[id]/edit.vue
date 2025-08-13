<!-- pages/post/[id]/edit.vue -->
<template>
  <div class="min-h-screen bg-background-primary">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <PageHeader>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg md:text-2xl font-bold text-text-primary mb-2">
              게시글 수정
            </h1>
            <p class="text-text-secondary">게시글을 수정해보세요</p>
          </div>

          <NuxtLink :to="`/post/${postId}`" class="btn btn-secondary">
            <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
            뒤로가기
          </NuxtLink>
        </div>
      </PageHeader>

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <Icon
          name="lucide:loader-2"
          class="w-8 h-8 animate-spin text-text-tertiary"
        />
        <span class="ml-2 text-text-tertiary">게시글을 불러오는 중...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="fetchError" class="text-center py-20">
        <Icon
          name="lucide:alert-triangle"
          class="w-16 h-16 text-status-error mx-auto mb-4"
        />
        <h2 class="text-xl font-semibold text-text-primary mb-2">
          게시글을 불러올 수 없습니다
        </h2>
        <p class="text-text-secondary mb-6">{{ fetchError }}</p>
        <NuxtLink to="/" class="btn btn-primary"> 홈으로 돌아가기 </NuxtLink>
      </div>

      <!-- Password confirmation modal -->
      <PasswordConfirmDialog
        ref="passwordDialogRef"
        :show="showPasswordModal"
        title="게시글 수정"
        message="게시글을 수정하려면 작성 시 사용한 비밀번호를 입력해주세요."
        confirm-text="확인"
        loading-text="확인 중..."
        placeholder="게시글 작성 시 사용한 비밀번호"
        confirm-icon="lucide:edit"
        @confirm="handlePasswordConfirm"
        @cancel="$router.back()"
      />

      <!-- Edit form -->
      <form
        v-if="isAuthenticated"
        @submit.prevent="handleSubmit"
        class="space-y-6"
      >
        <!-- 폼 컴포넌트 -->
        <PostForm
          v-model="form"
          :errors="errors"
          :disabled="submitting"
          mode="edit"
          @upload-error="handleUploadError"
        />

        <!-- 에러 메시지 -->
        <div
          v-if="submitError"
          class="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-red-700 text-sm">{{ submitError }}</p>
        </div>

        <!-- 버튼 -->
        <div
          class="flex justify-end space-x-4 pt-6 border-t border-border-muted"
        >
          <NuxtLink
            :to="`/post/${postId}`"
            class="btn"
            :class="{ 'opacity-50 pointer-events-none': submitting }"
          >
            <Icon name="lucide:x" class="w-4 h-4 mr-2" />
            취소
          </NuxtLink>

          <UiButton
            type="submit"
            variant="primary"
            :loading="submitting"
            :disabled="submitting || !isFormValid"
          >
            <Icon v-if="!submitting" name="lucide:save" class="w-4 h-4 mr-2" />
            {{ submitting ? "수정 중..." : "수정하기" }}
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// URL에서 게시글 ID 가져오기
const route = useRoute();
const postId = route.params.id as string;

// 페이지 메타 설정
useHead({
  title: "게시글 수정 - 익명 게시판",
});

// usePostEditor composable 사용
const {
  isAuthenticated,
  showPasswordModal,
  passwordDialogRef,
  form,
  errors,
  submitting,
  submitError,
  isFormValid,
  initialize,
  handlePasswordConfirm,
  handleSubmit,
  handleUploadError,
} = usePostEditor(postId);

// 게시글 데이터 가져오기 (비호환성 때문에 보존)
const { loading, error: fetchError } = usePost(postId);

// 컴포넌트 초기화
onMounted(() => {
  initialize();
});
</script>
