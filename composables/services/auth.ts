export function useAuthService() {
  const { POST } = useApi();

  return {
    login: (data: LoginRequest) =>
      POST('/auth/login', LoginResponseSchema, data, { skipLoading: true }),
    logout: () =>
      POST('/auth/logout', MessageResponseSchema, null, {
        skipLoading: true,
        skipToast: true,
      }),
    refresh: () =>
      POST('/auth/refresh', RefreshResponseSchema, null, {
        skipLoading: true,
        skipToast: true,
      }),
  };
}
