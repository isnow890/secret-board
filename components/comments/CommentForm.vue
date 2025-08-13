<!-- components/CommentForm.vue -->
<template>
  <div class="comment-form py-6 border-t border-border-muted mt-6">
    <div class="flex items-center mb-3">
      <!-- <Icon name="lucide:message-circle" class="w-4 h-4 mr-2 text-text-tertiary" /> -->
      <h3 class="font-medium text-text-primary">
        {{ parentComment ? "답글 작성" : "댓글 작성" }}
      </h3>

      <button
        v-if="parentComment && !compact"
        @click="$emit('cancel')"
        class="ml-auto text-text-tertiary hover:text-text-primary"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <!-- 텍스트 영역 -->
      <UiTextarea
        ref="contentTextareaRef"
        v-model="form.content"
        :placeholder="
          parentComment ? '답글을 입력하세요...' : '댓글을 입력하세요...'
        "
        :error="errors.content"
        :rows="3"
        :maxlength="1000"
        show-char-count
        resize="none"
        required
      />
      
      <!-- AI 말투 변경 버튼 -->
      <div class="mt-2">
        <AiReviseButton
          v-model="form.content"
          type="text"
          :disabled="loading || !form.content.trim()"
          @revise-start="handleAiReviseStart"
          @revise-success="handleAiReviseSuccess"
          @revise-error="handleAiReviseError"
        />
      </div>

      <!-- 닉네임과 비밀번호 섹션 -->
      <div class="space-y-3">
        <!-- 데스크탑과 모바일 통합 레이아웃 -->
        <div class="space-y-3">
          <!-- 닉네임 -->
          <div>
            <div
              class="flex items-center gap-2 text-base font-medium text-text-primary mb-2"
            >
              <Icon name="lucide:user" class="w-4 h-4" />
              <span>닉네임</span>
              <span class="text-status-error">*</span>
              <UiCheckbox
                v-model="form.isAuthor"
                label="글쓴이"
                size="sm"
                class="author-checkbox ml-3"
                @change="handleAuthorCheckChange"
              />
            </div>
            <div class="flex items-center">
              <UiInput
                v-model="form.nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                :error="errors.nickname"
                maxlength="15"
                :disabled="form.isAuthor || loading"
                class="w-full md:w-48"
                required
              />
            </div>
          </div>

          <!-- 비밀번호 -->
          <div>
            <div
              class="flex items-center gap-2 text-base font-medium text-text-primary mb-2"
            >
              <Icon name="lucide:lock" class="w-4 h-4" />
              <span>비밀번호</span>
              <span class="text-status-error">*</span>
            </div>
            <UiInput
              v-model="form.password"
              type="password"
              :placeholder="
                form.isAuthor ? '게시글 비밀번호 (4자리)' : '비밀번호 (4자리)'
              "
              :error="errors.password"
              class="w-full md:w-32"
              maxlength="4"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="new-password"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-form-type="other"
              required
            />
          </div>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="flex items-center flex-wrap gap-3">
        <div class="ml-auto flex items-center gap-2">
          <UiButton
            v-if="parentComment"
            variant="secondary"
            :disabled="loading"
            @click="$emit('cancel')"
          >
            취소
          </UiButton>

          <UiButton
            type="submit"
            variant="primary"
            :loading="loading"
            :disabled="loading || !isValid"
          >
            {{ parentComment ? "답글" : "댓글" }} 작성
          </UiButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import type { CreateCommentRequest, Comment } from "~/types";
import {
  generateRandomNickname,
  validateNickname,
} from "~/utils/nicknameGenerator";
import AiReviseButton from "~/components/ai/AiReviseButton.vue";

interface Props {
  postId: string;
  parentComment?: Comment;
  compact?: boolean;
  authorNickname?: string;
}

interface Emits {
  (e: "success", comment: Comment): void;
  (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// useComments composable 사용
const { createComment, createReply } = useComments(props.postId);

// 폼 상태
const form = reactive({
  content: "",
  nickname: "",
  password: "",
  isAuthor: false,
});

const errors = reactive({
  content: "",
  nickname: "",
  password: "",
});

const loading = ref(false);

// 화면 크기 감지
const isDesktop = ref(false);

// 유효성 검사
const isValid = computed(() => {
  const nicknameValidation = validateNickname(form.nickname);
  return (
    form.content.trim().length > 0 &&
    nicknameValidation.isValid &&
    form.password.length >= 4 &&
    form.content.length <= 1000
  );
});

// 유효성 검사 함수
const validateForm = () => {
  errors.content = "";
  errors.nickname = "";
  errors.password = "";

  if (!form.content.trim()) {
    errors.content = "내용을 입력하세요.";
    return false;
  }

  if (form.content.length > 1000) {
    errors.content = "내용은 1000자를 초과할 수 없습니다.";
    return false;
  }

  // 닉네임 검증
  const nicknameValidation = validateNickname(form.nickname);
  if (!nicknameValidation.isValid) {
    errors.nickname = nicknameValidation.error || "닉네임이 유효하지 않습니다.";
    return false;
  }

  if (form.password.length < 4) {
    errors.password = "비밀번호는 4자리 이상이어야 합니다.";
    return false;
  }

  return true;
};

// 글쓴이 체크박스 변경 핸들러
const handleAuthorCheckChange = () => {
  if (form.isAuthor) {
    // 글쓴이 닉네임으로 강제 설정 및 입력 비활성화
    if (props.authorNickname) {
      form.nickname = props.authorNickname;
    }
    useToast().add({
      title: "글쓴이 댓글",
      description: "게시글 작성 시 사용한 비밀번호를 입력해주세요.",
      color: "blue",
      timeout: 3000,
    });
  } else {
    // 글쓴이 해제 시 저장된 닉네임으로 복원하거나 랜덤 생성
    const savedNickname = getCommentNickname(props.postId);
    form.nickname = savedNickname || generateRandomNickname();
  }
};

// 댓글 작성
const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;

  try {
    const requestData: CreateCommentRequest = {
      postId: props.postId,
      content: form.content.trim(),
      nickname: form.nickname.trim(),
      password: form.password,
      isAuthor: form.isAuthor,
      ...(props.parentComment && { parentId: props.parentComment.id }),
    };

    console.log("Debug: Sending comment request with data:", {
      postId: requestData.postId,
      isAuthor: requestData.isAuthor,
      passwordLength: requestData.password.length,
    });

    let response;

    // 답글인 경우와 일반 댓글인 경우 구분
    if (props.parentComment) {
      response = await createReply(requestData, props.parentComment.id);
    } else {
      response = await createComment(requestData);
    }

    if (response && typeof response === "object" && "id" in response) {
      // 댓글 닉네임을 localStorage에 저장 (글쓴이가 아닌 경우만)
      if (!form.isAuthor) {
        saveCommentNickname(props.postId, form.nickname.trim());
      }

      // 성공 토스트 메시지
      useToast().add({
        title: props.parentComment
          ? "답글이 작성되었습니다"
          : "댓글이 작성되었습니다",
      });

      // 폼 초기화
      form.content = "";
      // 닉네임은 저장된 닉네임을 유지하거나 글쓴이인 경우에만 초기화
      if (form.isAuthor) {
        // 글쓴이인 경우 저장된 닉네임으로 복원하거나 랜덤 생성
        const savedNickname = getCommentNickname(props.postId);
        form.nickname = savedNickname || generateRandomNickname();
      }
      // 일반 댓글인 경우 현재 닉네임을 그대로 유지
      form.password = "";
      form.isAuthor = false;

      // 성공 이벤트 발생 - response가 Comment 형태인지 확인 후 전달
      if (response && typeof response === "object" && "id" in response) {
        emit("success", response as Comment);
      }
    }
  } catch (error: any) {
    console.error("댓글 작성 실패:", error);

    // 에러 처리 (유효성 검사 에러만 폼에 표시)
    if (error.status === 400 && error.data?.data) {
      // 유효성 검사 에러
      error.data.data.forEach((err: any) => {
        if (err.path[0] === "content") {
          errors.content = err.message;
        } else if (err.path[0] === "password") {
          errors.password = err.message;
        }
      });
    }
    // 다른 에러들은 composable에서 토스트로 처리됨
  } finally {
    loading.value = false;
  }
};

// 화면 크기 감지 함수
const updateScreenSize = () => {
  if (process.client) {
    isDesktop.value = window.innerWidth >= 768;
  }
};

// localStorage 닉네임 관리
const { getCommentNickname, saveCommentNickname } = useLocalStorage();

// 초기화
onMounted(() => {
  // 이전에 사용한 닉네임이 있으면 불러오기, 없으면 랜덤 생성
  const savedNickname = getCommentNickname(props.postId);
  if (savedNickname) {
    form.nickname = savedNickname;
  } else {
    form.nickname = generateRandomNickname();
  }
  
  nextTick(() => autoResizeTextarea());

  // 화면 크기 초기 감지
  updateScreenSize();

  // 화면 크기 변경 감지
  window.addEventListener("resize", updateScreenSize);

  onBeforeUnmount(() => {
    window.removeEventListener("resize", updateScreenSize);
  });
});

// 텍스트 영역 자동 리사이즈 (최대 15줄)
const contentTextareaRef = ref<any>(null);
const autoResizeTextarea = () => {
  if (!process.client) return;
  const wrapper = contentTextareaRef.value?.$el as HTMLElement | undefined;
  const textarea = wrapper?.querySelector(
    "textarea"
  ) as HTMLTextAreaElement | null;
  if (!textarea) return;

  // 초기화 후 내용 높이 측정
  textarea.style.height = "auto";
  const style = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(style.lineHeight || "20") || 20;
  const maxHeight = lineHeight * 15; // 최대 15줄
  const newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${newHeight}px`;
  textarea.style.overflowY =
    textarea.scrollHeight > maxHeight ? "auto" : "hidden";
};

watch(
  () => form.content,
  () => nextTick(() => autoResizeTextarea())
);

// AI 말투 변경 이벤트 핸들러
const handleAiReviseStart = () => {
  console.log('AI 말투 변경 시작');
};

const handleAiReviseSuccess = () => {
  console.log('AI 말투 변경 완료');
  // 텍스트 영역 자동 리사이즈
  nextTick(() => autoResizeTextarea());
};

const handleAiReviseError = (error: string) => {
  console.error('AI 말투 변경 실패:', error);
  // 에러는 AiReviseButton에서 이미 토스트로 표시됨
};

// 자동 포커스 제거 - 사용자가 직접 클릭하여 포커스 하도록 개선
</script>

<style scoped>
.comment-form {
  /* 경계선만 사용하는 심플 디자인 */
}

.comment-form textarea:focus {
  outline: none;
}

.author-checkbox :deep(label) {
  color: rgb(107 114 128) !important; /* text-gray-500 */
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
