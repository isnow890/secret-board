<!-- components/SiteHeader.vue -->
<template>
  <UiNavbar sticky :class="headerClasses" :navigation-items="[]">
    <!-- Logo & Brand Slot -->
    <template #logo>
      <NuxtLink
        to="/"
        class="flex items-center space-x-0 no-underline hover:opacity-80 transition-opacity duration-200"
      >
        <div class="w-14 h-14 flex items-center justify-center">
          <img
            src="/images/only_logo_green.png"
            alt="secret Logo"
            class="w-14 h-14 object-contain"
          />
        </div>
        <div class="block">
          <h1
            class="text-lg sm:text-lg font-bold text-white m-0 leading-tight pb-1"
          >
            {{ siteName }}
          </h1>

          <p class="text-xs text-gray-300 m-0 leading-tight hidden sm:block">
            소통공간이 되고 싶은 곳
          </p>
        </div>
      </NuxtLink>
    </template>

    <!-- Navigation space for future features -->
    <template #navigation>
      <!-- Navigation space reserved for future features -->
    </template>

    <!-- Desktop Actions -->
    <template #actions>
      <div class="flex items-center space-x-3">
        <NuxtLink
          v-if="!isEditPage"
          to="/post/create"
          class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue-hover transition-all duration-200 no-underline"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>글쓰기</span>
        </NuxtLink>
      </div>
    </template>

    <!-- Mobile Navigation -->
    <template #mobile-navigation>
      <!-- Simplified mobile navigation per user request -->
    </template>

    <!-- Mobile Actions -->
    <template #mobile-actions>
      <!-- Mobile actions simplified - create button is in main header -->
    </template>
  </UiNavbar>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

// Site name - always constant, not affected by any state
const siteName = ref("secret");

// 인증 상태 관리
const authStore = useAuthStore();
const { isAuthenticated, loading } = storeToRefs(authStore);
const { logout } = authStore;

// 현재 페이지가 게시글 수정 페이지인지 확인
const route = useRoute();
const isEditPage = computed(() => {
  return route.path.includes("/edit");
});

// 로그아웃 핸들러
const handleLogout = async () => {
  try {
    logout();
    await navigateTo("/login");
  } catch (error) {
    console.error("로그아웃 실패:", error);
  }
};

// Defensive measure: ensure site name never changes
// watch(siteName, (newValue) => {
//   if (newValue !== "익명 게시판") {
//     console.warn("Site name was changed, resetting to original value");
//     siteName.value = "익명 게시판";
//   }
// });

// Also prevent any external manipulation
onMounted(() => {
  const originalName = "secret";

  // Create a defensive interval to check if name has been changed
  const checkInterval = setInterval(() => {
    if (siteName.value !== originalName) {
      console.warn("Site name externally modified, resetting");
      siteName.value = originalName;
    }
  }, 1000);

  onBeforeUnmount(() => {
    clearInterval(checkInterval);
  });
});

// Header styling to maintain height consistency
const headerClasses = computed(() =>
  [
    "z-50",
    "bg-background-primary",
    "backdrop-blur-sm",
    "bg-opacity-98",
    "shadow-sm",
  ].join(" ")
);

// UiNavbar component handles mobile menu functionality and click outside behavior
// The click outside functionality is built into UiNavbar using onClickOutside
// Route change handling for mobile menu is also built into UiNavbar
</script>

<style scoped>
/* Custom styles for maintaining header height and visual consistency */
:deep(nav) {
  height: var(--header-height);
}

/* Ensure proper container height matches header-height */
:deep(nav .container) {
  height: var(--header-height);
}

:deep(nav .container > div) {
  height: var(--header-height);
}
</style>
