// types/shared/common.ts

// 유틸리티 타입들
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Nullable<T> = T | null;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 날짜/시간 관련
export type DateString = string; // ISO 8601 format
export type Timestamp = number; // Unix timestamp

// ID 타입들
export type UUID = string;
export type ID = string | number;

// 정렬 방향
export type SortDirection = 'asc' | 'desc';

// 상태 타입들
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// 이벤트 핸들러 타입들
export type EventHandler<T = void> = (event?: Event) => T;
export type AsyncEventHandler<T = void> = (event?: Event) => Promise<T>;

// 환경 설정
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  SITE_PASSWORD?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

// 에러 타입
export interface ApplicationError {
  name: string;
  message: string;
  code?: string;
  details?: any;
  stack?: string;
}