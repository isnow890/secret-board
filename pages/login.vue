<!-- pages/login.vue -->
<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-secondary via-background-primary to-background-elevated relative"
  >
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-20">
      <div
        class="h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:32px_32px]"
      ></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.05)_25px,rgba(255,255,255,0.05)_26px,transparent_27px),linear-gradient(transparent_24px,rgba(255,255,255,0.05)_25px,rgba(255,255,255,0.05)_26px,transparent_27px)] bg-[length:32px_32px]"
      ></div>
    </div>
    <div class="w-full max-w-sm px-6 md:px-4 relative z-10">
      <!-- Login Card -->
      <div class="card-elevated">
        <!-- Logo and Branding inside card -->
        <div class="text-center mb-8">
          <div class="mb-0">
            <img
              src="/images/main_logo.png"
              alt="secret logo"
              class="w-36 h-36 mx-auto"
            />
          </div>
          <h1 class="text-2xl md:text-4xl font-bold text-text-primary mb-0" translate="no">
            secret
          </h1>
          <p class="text-text-secondary" translate="no">
            소통공간이 되고 싶은 곳
          </p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <UiInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="비밀번호를 입력하세요"
            :disabled="loading"
            required
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-form-type="other"
            class="w-full"
          >
            <template #suffix>
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="text-text-tertiary hover:text-text-primary transition-colors"
                :disabled="loading"
              >
                <Icon 
                  :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" 
                  class="w-4 h-4" 
                />
              </button>
            </template>
          </UiInput>

          <UiButton
            type="submit"
            variant="primary"
            size="lg"
            :disabled="!password || loading"
            :loading="loading"
            class="w-full"
          >
            <Icon v-if="!loading" name="lucide:log-in" class="w-4 h-4 mr-2" />
            {{ loading ? "확인 중..." : "접속하기" }}
          </UiButton>

          <div
            v-if="error"
            class="bg-status-error-bg border border-status-error rounded-lg p-3"
          >
            <div class="flex items-center">
              <Icon
                name="lucide:alert-circle"
                class="w-4 h-4 text-status-error mr-2"
              />
              <span class="text-status-error text-sm">{{ error }}</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Terms and Privacy -->
      <div class="text-center mt-6 space-y-3">
        <p class="text-xs text-text-tertiary leading-relaxed">
          사이트에 접속함으로써
          <a
            href="/secret/terms"
            target="_blank"
            class="text-accent-blue hover:text-accent-blue-hover underline"
          >
            이용약관
          </a>
          과
          <a
            href="/secret/privacy"
            target="_blank"
            class="text-accent-blue hover:text-accent-blue-hover underline"
          >
            개인정보처리방침
          </a>
          에<br />동의하는 것으로 간주됩니다.
        </p>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-xs text-text-quaternary">
          &copy; {{ new Date().getFullYear() }}
          <a
            href="https://isnow.space"
            target="_blank"
            class="text-accent-blue hover:text-accent-blue-hover underline"
          >
            yidaemullyu
          </a>
          . All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

// 페이지 메타 정보 설정 - 번역 방지
useHead({
  title: "secret - login",
  meta: [
    { name: "google", content: "notranslate" },
    { name: "robots", content: "notranslate" },
  ],
  htmlAttrs: {
    lang: "ko",
  },
});

const authStore = useAuthStore();
const { isAuthenticated, loading, error } = storeToRefs(authStore);
const { login, checkAuth } = authStore;
const password = ref("");
const showPassword = ref(false);

const handleLogin = async () => {
  if (await login(password.value)) {
    await navigateTo("/");
  } else {
    password.value = "";
  }
};

// 이미 인증되어 있으면 메인페이지로 이동
onMounted(() => {
  checkAuth();
  if (isAuthenticated.value) {
    navigateTo("/");
  }
});
</script>
