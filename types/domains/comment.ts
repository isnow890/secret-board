// types/domains/comment.ts

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  nickname: string;
  password_hash: string;
  like_count: number;
  depth: number;
  reply_count: number;
  is_author: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  // 평면화된 댓글에서 사용하는 추가 속성들
  parentNickname?: string;
}

export interface CreateCommentRequest {
  postId: string;
  parentId?: string;
  content: string;
  nickname: string;
  password: string;
  isAuthor?: boolean;
}

export interface DeleteCommentRequest {
  password: string;
}

export interface DeleteCommentResponse {
  deleted: boolean;
  soft_deleted: boolean;
  comment_id: string;
}

export interface CommentLikeResponse {
  id: string;
  like_count: number;
}

// 최근 댓글용 확장 인터페이스
export interface RecentComment {
  id: string;
  post_id: string;
  post_title: string;
  content: string;
  nickname: string;
  created_at: string;
  is_author: boolean;
}