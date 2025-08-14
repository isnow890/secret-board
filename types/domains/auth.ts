// types/domains/auth.ts

/**
 * @description 인증 관련 설정을 정의하는 인터페이스
 */
export interface AuthConfig {
  /** 사이트 접근 비밀번호 */
  password: string;
  /** 세션 유지 시간 (초) */
  sessionDuration: number;
  /** 세션 정보를 저장할 쿠키 이름 */
  cookieName: string;
  /** 로컬 스토리지에 사용될 키 */
  localStorageKey: string;
}

/**
 * @description 로컬 스토리지에 저장되는 사용자 활동 데이터 인터페이스
 */
export interface LocalStorageData {
  /** 조회한 게시글 ID 목록 */
  board_viewed_posts: string[];
  /** 좋아요 누른 게시글 ID 목록 */
  board_liked_posts: string[];
  /** 좋아요 누른 댓글 ID 목록 */
  board_liked_comments: string[];
  /** 게시글 조회 타임스탬프 (조회수 중복 방지용) */
  board_view_timestamps: Record<string, number>;
  /** 마지막으로 방문한 페이지 번호 */
  board_last_page: number;
  /** 마지막으로 사용한 목록 조회 파라미터 */
  board_last_params: Record<string, string>;
  /** 사용자가 입력한 닉네임 캐시 */
  board_comment_nicknames: Record<string, string>;
}

/**
 * @description 사이트 접근 세션 정보를 나타내는 인터페이스
 */
export interface SessionInfo {
  /** 인증 여부 */
  isAuthenticated: boolean;
  /** 세션 만료 타임스탬프 */
  expiresAt: number;
  /** 세션 생성 타임스탬프 */
  createdAt: number;
}

/**
 * @description 게시글/댓글 수정 및 삭제 시 비밀번호 검증 요청 인터페이스
 */
export interface PasswordVerifyRequest {
  /** 검증할 비밀번호 */
  password: string;
}

/**
 * @description 비밀번호 검증 API의 응답 인터페이스
 */
export interface PasswordVerifyResponse {
  /** 비밀번호 일치 여부 */
  valid: boolean;
  /** 실패 시 메시지 */
  message?: string;
}