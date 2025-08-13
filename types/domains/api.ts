// types/domains/api.ts

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  pagination?: PaginationInfo | null;
  timestamp?: string;
  meta?: {
    total?: number;
  };
}

export interface PaginationInfo {
  nextCursor?: string | null;
  hasMore: boolean;
  total?: number;
}

// HTTP 메서드 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// API 에러 타입
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// 요청 옵션
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}