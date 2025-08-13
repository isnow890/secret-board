// types/domains/post.ts
import type { AttachedFile } from './upload'

/**
 * 게시글 인터페이스
 * @description 게시글의 전체 정보를 담는 인터페이스
 */
export interface Post {
  /** 게시글 고유 ID */
  id: string;
  /** 게시글 제목 */
  title: string;
  /** 게시글 내용 (HTML) */
  content: string;
  /** 작성자 닉네임 */
  nickname?: string;
  /** 텍스트 형태의 내용 (검색용) */
  plain_text?: string;
  /** 비밀번호 해시 (API에서는 보안상 제거됨) */
  password_hash?: string;
  /** 첨부파일 목록 */
  attached_files?: AttachedFile[];
  /** 조회수 */
  view_count: number | null;
  /** 좋아요 수 */
  like_count: number | null;
  /** 댓글 수 */
  comment_count: number | null;
  /** 마지막 댓글 작성 시간 */
  last_comment_at: string | null;
  /** 생성 시간 */
  created_at: string | null;
  /** 수정 시간 */
  updated_at: string | null;
  /** 삭제 여부 */
  is_deleted?: boolean;
  /** 삭제 시간 */
  deleted_at?: string | null;
  // API에서 추가되는 메타데이터 속성들
  /** 첨부파일 존재 여부 */
  hasAttachments?: boolean;
  /** 첨부파일 개수 */
  attachmentCount?: number;
}

/**
 * 게시글 요약 인터페이스
 * @description 게시글 목록에서 사용되는 요약 정보
 */
export interface PostSummary {
  /** 게시글 고유 ID */
  id: string;
  /** 게시글 제목 */
  title: string;
  /** 작성자 닉네임 */
  nickname?: string;
  /** 미리보기 텍스트 */
  preview: string;
  /** 게시글 내용 (이미지 추출을 위해 필요) */
  content?: string;
  /** 첨부파일 목록 */
  attached_files?: AttachedFile[];
  /** 조회수 */
  view_count: number | null;
  /** 좋아요 수 */
  like_count: number | null;
  /** 댓글 수 */
  comment_count: number | null;
  /** 생성 시간 */
  created_at: string | null;
  /** 마지막 댓글 시간 */
  last_comment_at: string | null;
  /** 삭제 여부 */
  is_deleted?: boolean;
  /** 첨부파일 존재 여부 */
  hasAttachments?: boolean;
  /** 첨부파일 개수 */
  attachmentCount?: number;
}

/**
 * 게시글 생성 요청 인터페이스
 * @description 새 게시글 작성 시 사용되는 데이터
 */
export interface CreatePostRequest {
  /** 게시글 제목 */
  title: string;
  /** 게시글 내용 */
  content: string;
  /** 작성자 닉네임 */
  nickname: string;
  /** 비밀번호 */
  password: string;
  /** 첨부파일 목록 */
  attachedFiles: AttachedFile[];
}

/**
 * 게시글 수정 요청 인터페이스
 * @description 게시글 수정 시 사용되는 데이터
 */
export interface EditPostRequest {
  /** 게시글 제목 */
  title: string;
  /** 게시글 내용 */
  content: string;
  /** 작성자 닉네임 */
  nickname: string;
  /** 비밀번호 */
  password: string;
  /** 첨부파일 목록 */
  attachedFiles: AttachedFile[];
}

/**
 * 게시글 목록 요청 인터페이스
 * @description 게시글 목록 조회 시 사용되는 파라미터
 */
export interface PostListRequest {
  /** 커서 기반 페이지네이션 커서 */
  cursor?: string;
  /** 한 페이지당 게시글 수 */
  limit?: number;
  /** 정렬 방식 */
  sort?: "created" | "activity" | "likes" | "views";
  /** 검색어 */
  search?: string;
}