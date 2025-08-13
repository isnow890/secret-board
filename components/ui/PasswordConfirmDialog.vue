<!-- components/PasswordConfirmDialog.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background-color: var(--color-bg-overlay)"
      @click.self="handleCancel"
    >
      <div
        class="bg-background-secondary border border-border-muted rounded-lg shadow-lg max-w-md w-full p-6"
      >
        <h3 class="text-lg font-medium text-text-primary mb-4">{{ title }}</h3>

        <p class="text-text-secondary mb-6">
          {{ message }}
        </p>

        <form @submit.prevent="handleConfirm" autocomplete="off" novalidate>
          <!-- 더미 입력 필드들 (비밀번호 매니저 혼란용) -->
          <input
            type="text"
            name="fake_username"
            autocomplete="username"
            style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;"
            tabindex="-1"
            aria-hidden="true"
          />
          <input
            type="password"
            name="fake_password"
            autocomplete="current-password"
            style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;"
            tabindex="-1"
            aria-hidden="true"
          />
          
          <div class="mb-6">
            <UiInput
              ref="passwordInput"
              v-model="password"
              type="password"
              label="비밀번호"
              :placeholder="placeholder"
              :error="errorMessage"
              maxlength="4"
              pattern="[0-9]{4}"
              inputmode="numeric"
              autocomplete="one-time-code"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bitwarden-watching="false"
              data-ms-editor="false"
              :name="`verify-password-${randomSuffix}`"
              role="textbox"
              @keyup.enter="handleConfirm"
              @keyup.esc="handleCancel"
              @input="clearError"
            />
          </div>
        </form>

        <div class="flex justify-end space-x-3">
          <UiButton
            variant="secondary"
            :disabled="loading"
            @click="handleCancel"
          >
            취소
          </UiButton>
          <UiButton
            :variant="dangerMode ? 'primary' : 'primary'"
            :loading="loading"
            :disabled="password.length !== 4 || loading"
            @click="handleConfirm"
          >
            <Icon v-if="!loading" :name="confirmIcon" class="w-4 h-4 mr-2" />
            {{ loading ? loadingText : confirmText }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  loadingText?: string;
  placeholder?: string;
  confirmIcon?: string;
  dangerMode?: boolean;
}

interface Emits {
  (e: "confirm", password: string): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: "확인",
  loadingText: "처리 중...",
  placeholder: "4자리 숫자를 입력해주세요",
  confirmIcon: "lucide:check",
  dangerMode: false,
});

const emit = defineEmits<Emits>();

// 상태
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");
const passwordInput = ref<{ focus: () => void }>();
const randomSuffix = ref(Math.random().toString(36).substring(7));

// 모달이 열릴 때 포커스 및 상태 초기화
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      password.value = "";
      loading.value = false;
      errorMessage.value = "";
      // 새로운 랜덤 접미사 생성 (비밀번호 매니저 우회용)
      randomSuffix.value = Math.random().toString(36).substring(7);
      nextTick(() => {
        passwordInput.value?.focus();
      });
    }
  }
);

// 에러 메시지 클리어
const clearError = () => {
  errorMessage.value = "";
};

// 비밀번호 입력값 감시하여 숫자만 허용
watch(password, (newValue) => {
  // 숫자가 아닌 문자 제거하고 4자리로 제한
  const numbersOnly = newValue.replace(/[^0-9]/g, '').slice(0, 4);
  
  // 값이 변경되었다면 업데이트
  if (numbersOnly !== newValue) {
    password.value = numbersOnly;
  }
});

// 외부에서 로딩 상태를 제어할 수 있도록 노출
const setLoading = (isLoading: boolean) => {
  loading.value = isLoading;
};

// 외부에서 에러 메시지를 설정할 수 있도록 노출
const setError = (error: string) => {
  errorMessage.value = error;
  loading.value = false;
};

// 확인 처리
const handleConfirm = () => {
  if (loading.value) return;
  
  // 4자리 숫자 검증
  if (password.value.length !== 4 || !/^\d{4}$/.test(password.value)) {
    setError("4자리 숫자를 입력해주세요.");
    return;
  }
  
  emit("confirm", password.value);
};

// 취소 처리
const handleCancel = () => {
  if (loading.value) return;
  emit("cancel");
};

// 외부에서 사용할 수 있도록 함수 노출
defineExpose({
  setLoading,
  setError,
});
</script>
