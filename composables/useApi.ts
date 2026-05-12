// composables/useApi.ts
import { z } from 'zod';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const;

export function useApi() {
  const config = useRuntimeConfig();
  const mergeOptions = (options: ApiOptions = {}, body?: any): ApiOptions => {
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...(options.headers || {}),
    };

    // SSR: 브라우저 쿠키를 API 서버로 포워딩
    if (import.meta.server) {
      const reqHeaders = useRequestHeaders(['cookie']);
      if (reqHeaders.cookie) {
        headers.cookie = reqHeaders.cookie;
      }
    }

    // FormData인 경우 Content-Type 제거 (브라우저가 자동으로 boundary 설정)
    if (body instanceof FormData) {
      delete headers['Content-Type'];
    }

    // SSR: 서버에서는 절대 URL로 API 직접 호출, CSR: routeRules 프록시 경유
    const baseURL = import.meta.server
      ? (config.apiBaseUrl as string)
      : (config.public.baseURL as string);

    return {
      ...options,
      baseURL: options.baseURL || baseURL,
      headers,
      credentials: 'include', // Cookie 전송을 위해 필수
      retry: false, // 자동 재시도 비활성화
    };
  };

  const handleError = (error: any): never => {
    const router = useRouter();
    const authStore = useAuthStore();
    const apiError: ApiError = {
      status: error.status || 500,
      message: error.data?.message || error.message || '알 수 없는 오류가 발생했습니다.',
    };

    // 인증 실패 또는 Token 만료
    if (apiError.status === 401) {
      // 로그아웃 상태로 변경
      authStore.reset();

      router.replace('/login');
    }

    if (apiError.status === 404 || apiError.status === 403) {
      router.replace('/404');
    } else if (apiError.status === 500) {
      router.replace('/500');
    } else {
      toast.error(apiError.message);
    }

    throw apiError;
  };

  const validateResponse = <T extends z.ZodType>(response: any, schema: T) => {
    try {
      return schema.parse(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw {
          status: 422,
          message: 'API 응답이 예상된 형식과 일치하지 않습니다.',
        } as ApiError;
      }
      throw {
        status: 422,
        message: 'API 응답이 예상된 형식과 일치하지 않습니다.',
      } as ApiError;
    }
  };

  const requestWithSchema = async <T extends z.ZodType>(
    url: string,
    options: ApiOptions,
    schema: T,
    body?: any
  ) => {
    try {
      if (!options.skipLoading) {
        startLoading();
      }
      const response = await $fetch(url, mergeOptions(options, body));
      return validateResponse(response, schema);
    } catch (error) {
      handleError(error);
    } finally {
      if (!options.skipLoading) {
        endLoading();
      }
    }
  };

  const mutationRequest = async <T extends z.ZodType>(
    method: ApiOptions['method'],
    url: string,
    schema: T,
    body?: any,
    options?: ApiOptions
  ) => {
    const response = await requestWithSchema<T>(url, { ...options, method, body }, schema, body);

    if (
      !options?.skipToast &&
      response &&
      (response as any).success !== false &&
      (response as any).message
    ) {
      toast.success((response as any).message);
    }

    return response;
  };

  return {
    GET: async <T extends z.ZodType>(url: string, schema: T, options?: ApiOptions) =>
      await requestWithSchema<T>(url, { ...options, method: 'GET' }, schema),

    POST: async <T extends z.ZodType>(url: string, schema: T, body?: any, options?: ApiOptions) =>
      await mutationRequest<T>('POST', url, schema, body, options),

    PUT: async <T extends z.ZodType>(url: string, schema: T, body?: any, options?: ApiOptions) =>
      await mutationRequest<T>('PUT', url, schema, body, options),

    PATCH: async <T extends z.ZodType>(url: string, schema: T, body?: any, options?: ApiOptions) =>
      await mutationRequest<T>('PATCH', url, schema, body, options),

    DELETE: async <T extends z.ZodType>(url: string, schema: T, body?: any, options?: ApiOptions) =>
      await mutationRequest<T>('DELETE', url, schema, body, options),
  };
}
