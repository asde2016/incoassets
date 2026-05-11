/**
 * 개별 페이지에 auth 적용
 * ex) definePageMeta({ middleware: 'auth' });
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // 경로 끝에 붙은 슬래시(/)를 제거하여 비교를 통일합니다. (단, 메인 홈 '/'는 예외)
  const normalizedPath = to.path === '/' ? '/' : to.path.replace(/\/$/, '');

  const authStore = useAuthStore();

  if (authStore.isAuthenticated) {
    if (from.name === undefined) {
      await authStore.refresh();
    }
    // 이미 로그인했는데 로그인 페이지로 가려고 하면 홈으로
    if (normalizedPath === '/login') {
      return navigateTo('/');
    }
  } else {
    if (normalizedPath !== '/login') {
      useCookie('auth_msg').value = '로그인 후 이용해 주세요.';

      return navigateTo({
        path: '/login',
        query: { next: to.fullPath },
      });
    }
  }
});
