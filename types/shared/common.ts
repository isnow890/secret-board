// types/shared/common.ts

/**
 * @description 특정 속성을 선택적으로 만드는 유틸리티 타입
 * @template T - 원본 타입
 * @template K - 선택적으로 만들 속성의 키
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * @description 특정 속성을 필수로 만드는 유틸리티 타입
 * @template T - 원본 타입
 * @template K - 필수로 만들 속성의 키
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * @description null 값을 허용하는 유틸리티 타입
 * @template T - 원본 타입
 */
export type Nullable<T> = T | null;

/**
 * @description 객체의 모든 속성을 재귀적으로 선택적으로 만드는 유틸리티 타입
 * @template T - 원본 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * @description ISO 8601 형식의 날짜 문자열을 나타내는 타입
 */
export type DateString = string;

/**
 * @description Unix 타임스탬프 (밀리초)를 나타내는 타입
 */
export type Timestamp = number;

/**
 * @description UUID 문자열을 나타내는 타입
 */
export type UUID = string;

/**
 * @description 숫자 또는 문자열 형식의 ID를 나타내는 타입
 */
export type ID = string | number;

/**
 * @description 데이터 정렬 방향을 나타내는 타입
 */
export type SortDirection = 'asc' | 'desc';

/**
 * @description 데이터 로딩 상태를 나타내는 타입
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * @description 폼 제출 상태를 나타내는 타입
 */
export type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * @description 동기 이벤트 핸들러 함수 타입을 정의
 * @template T - 핸들러의 반환 타입
 */
export type EventHandler<T = void> = (event?: Event) => T;

/**
 * @description 비동기 이벤트 핸들러 함수 타입을 정의
 * @template T - 핸들러가 resolve하는 프로미스의 타입
 */
export type AsyncEventHandler<T = void> = (event?: Event) => Promise<T>;

/**
 * @description 애플리케이션 환경 변수 설정을 정의하는 인터페이스
 */
export interface EnvironmentConfig {
  /** 실행 환경 (개발, 프로덕션, 테스트) */
  NODE_ENV: 'development' | 'production' | 'test';
  /** 사이트 전체 접근 비밀번호 (선택) */
  SITE_PASSWORD?: string;
  /** Supabase 프로젝트 URL */
  SUPABASE_URL: string;
  /** Supabase 익명 키 */
  SUPABASE_ANON_KEY: string;
}

/**
 * @description 애플리케이션 전반에서 사용되는 표준 에러 구조 인터페이스
 */
export interface ApplicationError {
  /** 에러 이름 */
  name: string;
  /** 에러 메시지 */
  message: string;
  /** 에러 코드 (선택) */
  code?: string;
  /** 에러 관련 추가 정보 */
  details?: any;
  /** 스택 트레이스 */
  stack?: string;
}