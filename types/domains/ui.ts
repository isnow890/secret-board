// types/domains/ui.ts
import type { SortDirection } from '../shared/common';

// Toast 관련 (실제 useToast에서 사용하는 구조)
export interface Toast {
  id: string;
  title: string;
  description?: string;
  color?: "red" | "gray" | "blue" | "green";
  variant?: "default" | "success" | "warning" | "error" | "info";
  timeout?: number;
}

// 기본 토스트 (간단한 버전)
export interface SimpleToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
}

// 통계 정보
export interface BoardStats {
  totalPosts: number;
  totalComments: number;
  todayPosts: number;
  todayComments: number;
}

// 공통 크기 타입
/**
 * 컴포넌트 크기 옵션
 * @description 모든 UI 컴포넌트에서 사용되는 표준 크기
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * 버튼 변형 타입
 * @description 버튼의 스타일 변형
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * 공통 버튼 속성
 * @description 모든 버튼 컴포넌트에서 사용되는 기본 Props
 */
export interface BaseButtonProps {
  /** 버튼 스타일 변형 */
  variant?: ButtonVariant;
  /** 버튼 크기 */
  size?: ComponentSize;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 상태 표시 */
  loading?: boolean;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 버튼 타입 */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * 입력 필드 타입
 * @description HTML input type 속성
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

/**
 * 공통 입력 속성
 * @description 모든 입력 컴포넌트에서 사용되는 기본 Props
 */
export interface BaseInputProps {
  /** 입력값 */
  modelValue?: string | number;
  /** 입력 필드 타입 */
  type?: InputType;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 읽기 전용 여부 */
  readonly?: boolean;
  /** 필수 입력 여부 */
  required?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 최대 입력 길이 */
  maxlength?: number;
  /** 입력 크기 */
  size?: ComponentSize;
}

/**
 * Select 옵션 인터페이스
 * @description 드롭다운, 셀렉트 컴포넌트에서 사용되는 옵션
 */
export interface SelectOption {
  /** 표시될 라벨 텍스트 */
  label: string;
  /** 실제 값 */
  value: string | number;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 메타데이터 */
  meta?: Record<string, any>;
}

/**
 * 네비게이션 아이템 인터페이스
 * @description 네비게이션 바, 메뉴에서 사용되는 아이템
 */
export interface NavigationItem {
  /** 표시될 라벨 */
  label: string;
  /** 링크 URL */
  href: string;
  /** 아이콘 이름 */
  icon?: string;
  /** 활성 상태 여부 */
  active?: boolean;
  /** 외부 링크 여부 */
  external?: boolean;
  /** 하위 메뉴 */
  children?: NavigationItem[];
}

/**
 * 페이지네이션 속성
 * @description 페이지네이션 컴포넌트에서 사용되는 Props
 */
export interface BasePaginationProps {
  /** 현재 페이지 번호 */
  currentPage: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 더 많은 데이터 존재 여부 */
  hasMore?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 페이지당 아이템 수 */
  perPage?: number;
  /** 전체 아이템 수 */
  totalItems?: number;
}

/**
 * 모달 크기 타입
 * @description 모달 컴포넌트에서 사용되는 크기
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * 모달 속성
 * @description 모달, 다이얼로그 컴포넌트에서 사용되는 Props
 */
export interface BaseModalProps {
  /** 모달 표시 여부 */
  show: boolean;
  /** 모달 제목 */
  title?: string;
  /** 모달 크기 */
  size?: ModalSize;
  /** 닫기 버튼 표시 여부 */
  closable?: boolean;
  /** 외부 클릭으로 닫기 방지 */
  persistent?: boolean;
  /** 스크롤 가능 여부 */
  scrollable?: boolean;
  /** 배경 오버레이 표시 여부 */
  overlay?: boolean;
}

/**
 * 상태 타입
 * @description UI 컴포넌트에서 사용되는 일반적인 상태
 */
export type UIState = 'idle' | 'loading' | 'success' | 'error' | 'warning';

// SortDirection은 shared/common.ts에서 import

/**
 * 테이블 컬럼 정의
 * @description 데이터 테이블에서 사용되는 컬럼 설정
 */
export interface TableColumn {
  /** 컬럼 키 */
  key: string;
  /** 표시될 라벨 */
  label: string;
  /** 정렬 가능 여부 */
  sortable?: boolean;
  /** 컬럼 너비 */
  width?: number | string;
  /** 정렬 방향 */
  sortDirection?: SortDirection;
  /** 커스텀 렌더 함수 */
  render?: (value: any, row: any) => string | any;
}