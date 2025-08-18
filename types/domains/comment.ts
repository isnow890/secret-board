// types/domains/comment.ts

/**
 * @description 댓글의 전체 정보를 나타내는 인터페이스
 */
export interface Comment {
  /** 댓글 고유 ID */
  id: string;
  /** 댓글이 속한 게시글의 ID */
  post_id: string;
  /** 부모 댓글의 ID (대댓글인 경우) */
  parent_id: string | null;
  /** 댓글 내용 (HTML) */
  content: string;
  /** 작성자 닉네임 */
  nickname: string;
  /** 비밀번호 해시 (API 응답에서는 제외됨) */
  password_hash: string;
  /** 좋아요 수 */
  like_count: number;
  /** 댓글 깊이 (0부터 시작) */
  depth: number;
  /** 대댓글 수 */
  reply_count: number;
  /** 게시글 작성자인지 여부 */
  is_author: boolean;
  /** 삭제 여부 (소프트 삭제) */
  is_deleted: boolean;
  /** 삭제된 시간 */
  deleted_at: string | null;
  /** 생성 시간 */
  created_at: string;
  /** 마지막 수정 시간 */
  updated_at: string;
  /** 대댓글 목록 (계층 구조) */
  replies?: Comment[];
  /** 부모 댓글 작성자 닉네임 (평면화된 목록에서 사용) */
  parentNickname?: string;
}

/**
 * @description 새 댓글 작성 시 서버로 전송하는 데이터 인터페이스
 */
export interface CreateCommentRequest {
  /** 댓글이 달릴 게시글의 ID */
  postId: string;
  /** 부모 댓글의 ID (대댓글인 경우) */
  parentId?: string;
  /** 댓글 내용 */
  content: string;
  /** 작성자 닉네임 */
  nickname: string;
  /** 비밀번호 */
  password: string;
  /** 게시글 작성자와 동일인인지 여부 */
  isAuthor?: boolean;
}

/**
 * @description 댓글 삭제 시 비밀번호 확인을 위해 전송하는 데이터 인터페이스
 */
export interface DeleteCommentRequest {
  /** 확인용 비밀번호 */
  password: string;
}

/**
 * @description 댓글 삭제 API의 응답 인터페이스
 */
export interface DeleteCommentResponse {
  /** 물리적 삭제 여부 */
  deleted: boolean;
  /** 논리적(소프트) 삭제 여부 */
  soft_deleted: boolean;
  /** 삭제된 댓글의 ID */
  comment_id: string;
}

/**
 * @description 댓글 좋아요 API의 응답 인터페이스
 */
export interface CommentLikeResponse {
  /** 좋아요가 적용된 댓글의 ID */
  id: string;
  /** 갱신된 좋아요 수 */
  like_count: number;
}

/**
 * @description 사이드바 '최근 댓글' 위젯에서 사용하는 데이터 인터페이스
 */
export interface RecentComment {
  /** 댓글 고유 ID */
  id: string;
  /** 댓글이 속한 게시글의 ID */
  post_id: string;
  /** 댓글이 속한 게시글의 제목 */
  post_title: string;
  /** 댓글 내용 미리보기 */
  content: string;
  /** 작성자 닉네임 */
  nickname: string;
  /** 생성 시간 */
  created_at: string;
  /** 게시글 작성자인지 여부 */
  is_author: boolean;
  /** 댓글 깊이 (대댓글 레벨) */
  depth: number;
}