<!-- pages/post/create.vue -->
<template>
  <div class="min-h-screen bg-background-primary">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <PageHeader>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg md:text-2xl font-bold text-text-primary mb-2">
              새 게시글 작성
            </h1>
            <p class="text-text-secondary">자유롭게 생각을 공유해보세요</p>
          </div>

          <NuxtLink to="/" class="btn btn-secondary">
            <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
            목록
          </NuxtLink>
        </div>
      </PageHeader>

      <form @submit.prevent="handleSubmit">
        <!-- 메인 폼 필드 -->
        <PostForm
          v-model="form"
          :errors="errors"
          :disabled="submitting"
          @upload-error="handleUploadError"
        />

        <!-- 에러 메시지 -->
        <div
          v-if="submitError"
          class="p-4 bg-red-50 border border-red-200 rounded-lg mt-6"
        >
          <p class="text-red-700 text-sm">{{ submitError }}</p>
        </div>

        <!-- 액션 버튼 -->
        <PostFormActions
          :can-save-draft="canSaveDraft"
          :has-saved-draft="hasSavedDraft"
          :is-form-valid="isFormValid"
          :submitting="submitting"
          @save-draft="saveDraft"
          @delete-draft="handleDeleteDraft"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CreatePostRequest } from "~/types";
import { generateRandomNickname } from "~/utils/nicknameGenerator";

// 페이지 메타 설정
useHead({
  title: "새 게시글 작성 - 익명 게시판",
});

// 상태 관리
const form = ref<CreatePostRequest>({
  title: "",
  content: "",
  nickname: "",
  password: "",
  attachedFiles: [],
});

const submitting = ref(false);
const submitError = ref("");

// Composables
const { createPost } = usePosts();
const { add: addToast } = useToast();

// 폼 검증
const { errors, isFormValid, validateForm } = usePostFormValidation(form);

// 임시저장 관리
const {
  hasSavedDraft,
  canSaveDraft,
  checkDraftExists,
  loadDraft,
  saveDraft,
  deleteDraft,
  clearDraft,
} = useDraftManager(form);

// 초기화
onMounted(() => {
  // 랜덤 닉네임 생성
  if (!form.value.nickname) {
    form.value.nickname = generateRandomNickname();
  }

  loadDraft();
  checkDraftExists();
});

// 임시저장 삭제 핸들러
const handleDeleteDraft = () => {
  const success = deleteDraft();
  if (success) {
    // 폼 초기화
    form.value = {
      title: "",
      content: "",
      nickname: generateRandomNickname(),
      password: "",
      attachedFiles: [],
    };

    addToast({
      title: "임시저장 삭제됨",
      description: "임시저장된 내용이 삭제되고 폼이 초기화되었습니다.",
      variant: "success",
      timeout: 3000,
    });
  }
};

// 폼 제출
const handleSubmit = async () => {
  if (!validateForm()) return;

  submitting.value = true;
  submitError.value = "";

  try {
    // 제목과 내용 트림
    const submitData = {
      ...form.value,
      title: form.value.title.trim(),
      content: form.value.content.trim(),
    };

    const createdPost = await createPost(submitData);

    if (createdPost) {
      // 임시저장 삭제
      clearDraft();

      // 성공 알림
      // addToast({
      //   title: '게시글 작성 완료',
      //   description: '새 게시글이 성공적으로 작성되었습니다.',
      //   variant: 'success',
      //   timeout: 3000,
      // })

      // 상세 페이지로 이동
      await navigateTo(`/post/${createdPost.id}`);
    }
  } catch (error: any) {
    if (error.data?.message) {
      submitError.value = error.data.message;
    } else if (error.statusMessage) {
      submitError.value = error.statusMessage;
    } else {
      submitError.value = "게시글 작성에 실패했습니다. 다시 시도해주세요.";
    }
  } finally {
    submitting.value = false;
  }
};

// 파일 업로드 에러 핸들러
const handleUploadError = (error: string) => {
  console.error("파일 업로드 오류:", error);
  alert(`파일 업로드 오류: ${error}`);
};

// 페이지 이탈 시 경고
const router = useRouter();

onMounted(() => {
  // 브라우저 새로고침/닫기 시 경고
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (canSaveDraft.value && !submitting.value && !isFormValid.value) {
      event.preventDefault();
      event.returnValue =
        "작성 중인 내용이 있습니다. 필요시 임시저장 후 페이지를 나가세요.";
      return event.returnValue;
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  // 라우터 이동 시 경고
  const removeGuard = router.beforeEach((to, from) => {
    if (from.path === "/post/create" && to.path !== from.path) {
      if (canSaveDraft.value && !submitting.value && !isFormValid.value) {
        const confirmed = confirm(
          "작성 중인 내용이 있습니다. 정말로 페이지를 나가시겠습니까?\n\n작성 중인 내용은 사라집니다. 필요시 임시저장 후 나가세요."
        );
        if (!confirmed) {
          return false;
        }
      }
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    removeGuard();
  });
});
</script>
