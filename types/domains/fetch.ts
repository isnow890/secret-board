// types/domains/fetch.ts - $fetch 관련 타입 정의

import type { ApiResponse } from './api';

/**
 * $fetch 요청 옵션 타입
 */
export interface FetchOptions<T = any> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: T;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  onUploadProgress?: (progress: { percent: number }) => void;
}

/**
 * $fetch 요청 타입
 */
export type FetchRequest = string;

/**
 * $fetch 응답 타입
 */
export type FetchResponse<T = any> = ApiResponse<T>;

/**
 * $fetch 함수 타입 정의
 */
export interface $Fetch {
  <T = any>(request: FetchRequest, options?: FetchOptions): Promise<FetchResponse<T>>;
  raw: <T = any>(request: FetchRequest, options?: FetchOptions) => Promise<Response>;
  create: (options?: FetchOptions) => $Fetch;
}

/**
 * Mock $fetch 타입 (테스트용)
 */
export interface MockFetch extends $Fetch {
  mockResolvedValue: (value: any) => void;
  mockRejectedValue: (error: any) => void;
  mockResolvedValueOnce: (value: any) => void;
  mockRejectedValueOnce: (error: any) => void;
  mockImplementation: (fn: (...args: any[]) => any) => void;
}