// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // 서버 사이드에서는 실행하지 않음
  if (process.server) return;

  // 공개 페이지들은 인증 체크 제외 (baseURL 포함)
  const publicPaths = [
    "/secret/login",
    "/login",
    "/terms",
    "/privacy",
    "/secret/design",
    "/secret/terms",
    "/secret/privacy",
  ];
  if (publicPaths.includes(to.path)) return;

  // 클라이언트에서만 실행
  if (!process.client) return;

  const authStore = useAuthStore();

  // 인증 상태 확인 후 리다이렉트
  await nextTick();

  // 인증 상태가 초기화되지 않았으면 체크
  if (!authStore.isInitialized) {
    const isAuth = authStore.checkAuth();
    if (!isAuth) {
      return navigateTo("/login");
    }
  } else if (!authStore.isAuthenticated) {
    return navigateTo("/login");
  }
});
