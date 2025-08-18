// types/domains/api.ts

/**
 * @description 서버 API의 표준 응답 형식을 정의하는 인터페이스
 * @template T - API가 성공 시 반환하는 데이터의 타입
 */
export interface ApiResponse<T = any> {
  /** 요청 성공 여부 */
  success: boolean;
  /** 성공 시 반환되는 데이터 */
  data: T | null;
  /** 실패 시 반환되는 에러 메시지 */
  error: string | null;
  /** 페이지네이션 정보 (목록 조회 API의 경우) */
  pagination?: PaginationInfo | null;
  /** 응답 생성 타임스탬프 */
  timestamp?: string;
  /** 추가적인 메타 데이터 */
  meta?: {
    /** 전체 아이템 개수 */
    total?: number;
  };
}

/**
 * @description 커서 기반 페이지네이션 정보를 담는 인터페이스
 */
export interface PaginationInfo {
  /** 다음 페이지를 조회하기 위한 커서 */
  nextCursor?: string | null;
  /** 추가 페이지 존재 여부 */
  hasMore: boolean;
  /** 전체 아이템 개수 (선택적) */
  total?: number;
}

/**
 * @description HTTP 요청 메서드를 나타내는 타입
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * @description API 에러 발생 시의 상세 정보를 담는 인터페이스
 */
export interface ApiError {
  /** 에러 코드 */
  code: string;
  /** 에러 메시지 */
  message: string;
  /** 에러 상세 내용 */
  details?: any;
  /** 에러 발생 타임스탬프 */
  timestamp: string;
}

/**
 * @description API 요청 시 사용되는 옵션 인터페이스
 */
export interface RequestOptions {
  /** HTTP 메서드 */
  method?: HttpMethod;
  /** 요청 헤더 */
  headers?: Record<string, string>;
  /** 요청 본문 */
  body?: any;
  /** 타임아웃 시간 (ms) */
  timeout?: number;
}

// 게시글 API 응답 타입들

/**
 * 게시글 목록 조회 응답 타입
 */
export interface PostListResponse {
  posts: import('./post').PostSummary[];
  pagination: PaginationInfo;
}

/**
 * 게시글 상세 조회 응답 타입
 */
export type PostDetailResponse = import('./post').Post;

/**
 * 게시글 작성 응답 타입
 */
export type PostCreateResponse = import('./post').Post;

/**
 * 게시글 수정 응답 타입
 */
export type PostEditResponse = import('./post').Post;

/**
 * 게시글 삭제 응답 타입
 */
export interface PostDeleteResponse {
  deletedImages: number;
  deletedAttachments: number;
}

/**
 * 게시글 비밀번호 확인 응답 타입
 */
export interface PostPasswordVerifyResponse {
  valid: boolean;
}

/**
 * 조회수 증가 응답 타입
 */
export interface PostViewResponse {
  message: string;
}

// 댓글 API 응답 타입들

/**
 * 댓글 목록 조회 응답 타입
 */
export interface CommentListResponse {
  comments: import('./comment').Comment[];
  total_count: number;
}

/**
 * 좋아요 응답 타입
 */
export interface LikeResponse {
  like_count: number;
  is_liked: boolean;
}