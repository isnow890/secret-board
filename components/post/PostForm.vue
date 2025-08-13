<!-- components/post/PostForm.vue -->
<template>
  <div class="space-y-6">
    <!-- 제목 -->
    <UiInput
      v-model="modelValue.title"
      type="text"
      label="제목"
      placeholder="제목을 입력하세요 (최소 3자)"
      :error="errors.title"
      :disabled="disabled"
      class="w-full"
      required
    />
    <div
      v-if="modelValue.title.length > 0 && modelValue.title.trim().length < 3"
      class="mt-1 text-sm text-orange-500"
    >
      제목이 너무 짧습니다. (현재: {{ modelValue.title.trim().length }}자, 최소:
      3자)
    </div>
    <div
      v-else-if="modelValue.title.trim().length >= 3"
      class="mt-1 text-sm text-green-500"
    >
      ✓ 제목 길이 조건 만족 ({{ modelValue.title.trim().length }}자)
    </div>

    <!-- 내용 -->
    <div>
      <label class="block text-sm font-medium text-text-primary mb-2">
        내용 <span class="text-status-error">*</span>
      </label>
      <ClientOnly>
        <TiptapEditor
          v-model="modelValue.content"
          placeholder="내용을 입력하세요..."
          :readonly="disabled"
        />
        <template #fallback>
          <div
            class="min-h-[200px] border border-border-muted rounded-md p-3 bg-background-secondary flex items-center justify-center"
          >
            <span class="text-text-tertiary">에디터 로딩 중...</span>
          </div>
        </template>
      </ClientOnly>
      <p v-if="errors.content" class="mt-1 text-sm text-red-500">
        {{ errors.content }}
      </p>
      <div
        v-else-if="contentTextLength > 0 && contentTextLength < 10"
        class="mt-1 text-sm text-orange-500"
      >
        내용이 너무 짧습니다. (현재: {{ contentTextLength }}자, 최소: 10자)
      </div>
      <div
        v-else-if="contentTextLength >= 10"
        class="mt-1 text-sm text-green-500"
      >
        ✓ 내용 길이 조건 만족 ({{ contentTextLength }}자)
      </div>
    </div>

    <!-- 닉네임과 비밀번호 (create 모드에서만 표시) -->
    <div v-if="mode === 'create'" class="space-y-3">
      <!-- 닉네임 -->
      <div>
        <div
          class="flex items-center gap-2 text-base font-medium text-text-primary mb-2"
        >
          <Icon name="lucide:user" class="w-4 h-4" />
          <span>닉네임</span>
          <span class="text-status-error">*</span>
        </div>
        <div class="flex items-center">
          <UiInput
            v-model="modelValue.nickname"
            type="text"
            placeholder="닉네임을 입력하세요"
            :error="errors.nickname"
            :disabled="disabled"
            maxlength="15"
            class="w-full md:w-48"
            required
          />
        </div>
        <p class="text-xs text-text-tertiary mt-1">
          최대 15자까지 입력 가능합니다.
        </p>
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
          v-model="modelValue.password"
          type="password"
          placeholder="4자리 숫자"
          :error="errors.password"
          :disabled="disabled"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          data-form-type="other"
          maxlength="4"
          inputmode="numeric"
          pattern="[0-9]{4}"
          class="w-full md:w-32"
          required
        />
        <p class="text-xs text-text-tertiary mt-1">
          게시글 수정/삭제 시 필요한 4자리 숫자입니다.
        </p>
        <div
          v-if="
            modelValue.password.length > 0 && modelValue.password.length !== 4
          "
          class="mt-1 text-sm text-orange-500"
        >
          비밀번호는 4자리여야 합니다. (현재:
          {{ modelValue.password.length }}자)
        </div>
        <div
          v-else-if="
            modelValue.password.length === 4 &&
            !/^[0-9]{4}$/.test(modelValue.password)
          "
          class="mt-1 text-sm text-orange-500"
        >
          비밀번호는 숫자만 입력 가능합니다.
        </div>
        <div
          v-else-if="
            modelValue.password.length === 4 &&
            /^[0-9]{4}$/.test(modelValue.password)
          "
          class="mt-1 text-sm text-green-500"
        >
          ✓ 비밀번호 조건 만족
        </div>
      </div>
    </div>

    <!-- 수정 페이지 광고 (첨부파일 위) -->
    <div v-if="mode === 'edit' && shouldShowEditAd" class="py-4 border-t border-b border-border-muted bg-background-secondary/20">
      <div class="w-full">
        <CoupangAd 
          :src="editAdUrl" 
          :height="84" 
          :width="'80%'"
        />
      </div>
    </div>

    <!-- 파일 업로드 -->
    <div>
      <label class="block text-sm font-medium text-text-primary mb-2">
        첨부파일
      </label>
      <ClientOnly>
        <FileUploader
          v-model="modelValue.attachedFiles"
          :max-files="5"
          @upload-error="$emit('uploadError', $event)"
        />
        <template #fallback>
          <div
            class="border border-border-muted rounded-md p-4 bg-background-secondary text-center text-text-tertiary"
          >
            파일 업로더 로딩 중...
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CreatePostRequest, EditPostRequest } from "~/types";

import TiptapEditor from "../editor/TiptapEditor.vue";
import FileUploader from "../editor/FileUploader.vue";

type PostFormData = CreatePostRequest | EditPostRequest;

interface Props {
  modelValue: PostFormData;
  errors: Partial<Record<keyof PostFormData, string>>;
  disabled?: boolean;
  mode?: "create" | "edit";
}

interface Emits {
  (e: "update:modelValue", value: PostFormData): void;
  (e: "uploadError", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "create",
});
defineEmits<Emits>();

// 환경변수에서 쿠팡 광고 설정 가져오기
const config = useRuntimeConfig();
const shouldShowEditAd = computed(() => 
  config.public.adVisible === 'true' && config.public.adPostDetailEnabled === 'true'
);
const editAdUrl = computed(() => config.public.coupangPostAdUrl);

// 내용의 순수 텍스트 길이 계산
const contentTextLength = computed(() => {
  return props.modelValue.content.replace(/<[^>]*>/g, "").trim().length;
});
</script>
