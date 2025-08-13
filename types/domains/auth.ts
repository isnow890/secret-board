// types/domains/auth.ts

export interface AuthConfig {
  password: string;
  sessionDuration: number;
  cookieName: string;
  localStorageKey: string;
}

export interface LocalStorageData {
  board_viewed_posts: string[];
  board_liked_posts: string[];
  board_liked_comments: string[];
  board_view_timestamps: Record<string, number>;
  board_last_page: number;
  board_last_params: Record<string, string>;
  board_comment_nicknames: Record<string, string>;
}

// 세션 정보
export interface SessionInfo {
  isAuthenticated: boolean;
  expiresAt: number;
  createdAt: number;
}

// 비밀번호 검증 요청/응답
export interface PasswordVerifyRequest {
  password: string;
}

export interface PasswordVerifyResponse {
  valid: boolean;
  message?: string;
}