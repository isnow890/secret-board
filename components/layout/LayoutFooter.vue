<template>
  <footer :class="footerClasses">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div :class="contentClasses">
        <!-- Left section - Copyright -->
        <div class="order-2 sm:order-1">
          <slot name="left">
            <!-- Copyright -->
            <div
              v-if="showCopyright"
              class="text-sm text-text-tertiary text-center sm:text-left"
            >
              © {{ new Date().getFullYear() }}
              <a
                href="https://isnow.space"
                target="_blank"
                class="text-accent-blue hover:text-accent-blue-hover underline"
              >
                yidaemullyu
              </a>
              . All rights reserved.
            </div>
          </slot>
        </div>

        <!-- Right section - Links and Actions -->
        <div
          class="order-1 sm:order-2 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
        >
          <slot name="right">
            <!-- Links -->
            <nav v-if="links?.length" class="flex items-center gap-4">
              <template v-for="link in links" :key="link.name">
                <NuxtLink
                  v-if="link.href"
                  :to="link.href"
                  :target="link.external ? '_blank' : undefined"
                  :rel="link.external ? 'noopener noreferrer' : undefined"
                  class="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {{ link.name }}
                  <Icon
                    v-if="link.external"
                    name="lucide:external-link"
                    class="w-3 h-3 ml-1 inline"
                  />
                </NuxtLink>
                <span v-else class="text-sm text-text-tertiary">{{
                  link.name
                }}</span>
              </template>
            </nav>

            <!-- GitHub Link -->
            <a
              href="https://github.com/isnow890/hit-secret"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-2 py-1.5 text-text-tertiary hover:text-text-secondary transition-all duration-200 rounded-md hover:bg-interactive-hover"
              title="GitHub"
            >
              <Icon name="lucide:github" class="w-4 h-4" />
            </a>

            <!-- Logout Button -->
            <button
              v-if="isAuthenticated"
              @click="handleLogout"
              class="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-text-tertiary hover:text-text-secondary hover:bg-interactive-hover rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              :disabled="logoutLoading"
            >
              <Icon
                :name="logoutLoading ? 'lucide:loader-2' : 'lucide:log-out'"
                :class="['w-4 h-4', logoutLoading ? 'animate-spin' : '']"
              />
              <span>로그아웃</span>
            </button>
          </slot>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface FooterLink {
  name: string;
  href?: string;
  external?: boolean;
}

interface SocialLink {
  name: string;
  href: string;
  icon: string;
}

interface LayoutFooterProps {
  brandName?: string;
  showLogo?: boolean;
  showCopyright?: boolean;
  copyrightText?: string;
  links?: FooterLink[];
  socialLinks?: SocialLink[];
  variant?: "default" | "minimal";
  class?: string;
}

const props = withDefaults(defineProps<LayoutFooterProps>(), {
  brandName: "secret",
  showLogo: false,
  showCopyright: true,
  variant: "default",
  copyrightText: () =>
    `© ${new Date().getFullYear()} yidaemullyu. All rights reserved.`,
  links: () => [
    { name: "이용약관", href: "/terms" },
    { name: "개인정보처리방침", href: "/privacy" },
  ],
  socialLinks: () => [],
});

const footerClasses = computed(() => {
  const baseClasses = [
    "bg-background-primary",
    "border-t",
    "border-border-muted",
  ];

  const variantClasses = {
    default: ["py-8"],
    minimal: ["py-4"],
  };

  return [...baseClasses, ...variantClasses[props.variant], props.class]
    .filter(Boolean)
    .join(" ");
});

const contentClasses = computed(() => {
  return [
    "flex",
    "items-center",
    "justify-between",
    "flex-col",
    "sm:flex-row",
    "gap-4",
  ].join(" ");
});

// 인증 관련 로직 (Pinia store 사용)
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
const { logout } = authStore;
const logoutLoading = ref(false);

// 로그아웃 처리
const handleLogout = async () => {
  logoutLoading.value = true;

  try {
    // 로그아웃 실행 (localStorage 클리어)
    logout();

    // 토스트 메시지 표시
    useToast().add({
      title: "로그아웃 완료",
      description: "성공적으로 로그아웃되었습니다.",
      color: "green",
      timeout: 3000,
    });

    // 로그인 페이지로 이동
    await navigateTo("/login");
  } catch (error) {
    console.error("로그아웃 처리 중 오류:", error);

    useToast().add({
      title: "로그아웃 오류",
      description: "로그아웃 처리 중 문제가 발생했습니다.",
      color: "red",
      timeout: 5000,
    });
  } finally {
    logoutLoading.value = false;
  }
};
</script>
