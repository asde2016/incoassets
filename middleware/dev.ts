export default defineNuxtRouteMiddleware(() => {
  const isDev = import.meta.dev;

  if (!isDev) {
    return navigateTo('/', { redirectCode: 404 });
  }
});
