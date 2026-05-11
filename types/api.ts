export interface ApiError {
  status: number;
  message: string;
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  immediate?: boolean;
  baseURL?: string;
  skipLoading?: boolean;
  skipToast?: boolean;
  [key: string]: any;
}
