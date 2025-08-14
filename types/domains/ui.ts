// types/domains/ui.ts
import type { SortDirection } from '../shared/common';

/**
 * @description Toast 알림 메시지의 상세 정보를 나타내는 인터페이스
 */
export interface Toast {
  /** Toast의 고유 ID */
  id: string;
  /** Toast 제목 */
  title: string;
  /** Toast 상세 설명 */
  description?: string;
  /** 색상 테마 */
  color?: "red" | "gray" | "blue" | "green";
  /** 스타일 변형 */
  variant?: "default" | "success" | "warning" | "error" | "info";
  /** 표시 시간 (ms) */
  timeout?: number;
}

/**
 * @description 간단한 형태의 Toast 알림 메시지 인터페이스
 */
export interface SimpleToast {
  /** Toast의 고유 ID */
  id: string;
  /** 표시될 메시지 */
  message: string;
  /** Toast 타입 */
  type: 'success' | 'error' | 'warning' | 'info';
  /** 표시 시간 (ms) */
  duration?: number;
  /** 사용자가 닫기 전까지 계속 표시할지 여부 */
  persistent?: boolean;
}

/**
 * @description 사이드바에 표시될 게시판 통계 정보 인터페이스
 */
export interface BoardStats {
  /** 총 게시글 수 */
  totalPosts: number;
  /** 총 댓글 수 */
  totalComments: number;
  /** 오늘 작성된 게시글 수 */
  todayPosts: number;
  /** 오늘 작성된 댓글 수 */
  todayComments: number;
  /** 마지막 업데이트 시간 */
  lastUpdated: string;
}

/**
 * @description UI 컴포넌트의 크기를 정의하는 타입
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * @description 버튼의 시각적 스타일을 정의하는 타입
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * @description 모든 버튼 컴포넌트의 기본 속성을 정의하는 인터페이스
 */
export interface BaseButtonProps {
  /** 버튼 스타일 변형 */
  variant?: ButtonVariant;
  /** 버튼 크기 */
  size?: ComponentSize;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 상태 표시 여부 */
  loading?: boolean;
  /** 부모 요소의 전체 너비를 차지할지 여부 */
  fullWidth?: boolean;
  /** HTML button 타입 */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * @description HTML <input> 요소의 type 속성을 정의하는 타입
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

/**
 * @description 모든 입력 필드 컴포넌트의 기본 속성을 정의하는 인터페이스
 */
export interface BaseInputProps {
  /** 입력 필드의 현재 값 */
  modelValue?: string | number;
  /** 입력 필드 타입 */
  type?: InputType;
  /** 입력 필드에 표시될 안내 문구 */
  placeholder?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 읽기 전용 여부 */
  readonly?: boolean;
  /** 필수 입력 여부 */
  required?: boolean;
  /** 유효성 검사 실패 시 표시될 에러 메시지 */
  error?: string;
  /** 입력 필드 아래에 표시될 도움말 텍스트 */
  helperText?: string;
  /** 최대 입력 길이 */
  maxlength?: number;
  /** 입력 필드 크기 */
  size?: ComponentSize;
}

/**
 * @description Select(드롭다운) 컴포넌트의 각 항목을 정의하는 인터페이스
 */
export interface SelectOption {
  /** 사용자에게 표시될 텍스트 */
  label: string;
  /** 선택 시 반환될 실제 값 */
  value: string | number;
  /** 해당 옵션의 비활성화 여부 */
  disabled?: boolean;
  /** 추가적인 메타데이터 */
  meta?: Record<string, any>;
}

/**
 * @description 네비게이션 메뉴 항목을 정의하는 인터페이스
 */
export interface NavigationItem {
  /** 메뉴에 표시될 텍스트 */
  label: string;
  /** 이동할 경로 */
  href: string;
  /** 메뉴 아이콘 */
  icon?: string;
  /** 현재 활성화된 메뉴인지 여부 */
  active?: boolean;
  /** 외부 링크인지 여부 (새 탭에서 열기) */
  external?: boolean;
  /** 하위 메뉴 목록 */
  children?: NavigationItem[];
}

/**
 * @description 페이지네이션 컴포넌트의 기본 속성을 정의하는 인터페이스
 */
export interface BasePaginationProps {
  /** 현재 페이지 번호 */
  currentPage: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 다음 페이지 존재 여부 */
  hasMore?: boolean;
  /** 데이터 로딩 중인지 여부 */
  loading?: boolean;
  /** 페이지 당 항목 수 */
  perPage?: number;
  /** 전체 항목 수 */
  totalItems?: number;
}

/**
 * @description 모달 컴포넌트의 크기를 정의하는 타입
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * @description 모달 및 다이얼로그 컴포넌트의 기본 속성을 정의하는 인터페이스
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
  /** 모달 외부 클릭 시 닫히지 않도록 설정 */
  persistent?: boolean;
  /** 모달 내용이 길 경우 스크롤 가능하도록 설정 */
  scrollable?: boolean;
  /** 뒷 배경 어둡게 처리 여부 */
  overlay?: boolean;
}

/**
 * @description UI 컴포넌트의 비동기 작업 상태를 나타내는 타입
 */
export type UIState = 'idle' | 'loading' | 'success' | 'error' | 'warning';

/**
 * @description 데이터 테이블의 컬럼 속성을 정의하는 인터페이스
 */
export interface TableColumn {
  /** 데이터를 참조하는 고유 키 */
  key: string;
  /** 테이블 헤더에 표시될 라벨 */
  label: string;
  /** 정렬 가능 여부 */
  sortable?: boolean;
  /** 컬럼 너비 */
  width?: number | string;
  /** 현재 정렬 방향 */
  sortDirection?: SortDirection;
  /** 셀 내용을 커스텀 렌더링하는 함수 */
  render?: (value: any, row: any) => string | any;
}