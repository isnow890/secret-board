// server/services/commentService.ts
import type { H3Event } from 'h3';
import { 
  getSupabaseClient, 
  hashPassword, 
  commentHelpers,
  postHelpers 
} from '~/server/utils/database';
import { errors, handleSupabaseError } from '~/server/utils/errorHandler';
import type { CreateCommentData, UpdateCommentData } from '~/server/utils/validation';

/**
 * 댓글 서비스 클래스
 */
export class CommentService {
  
  /**
   * 댓글 목록 조회 (특정 게시글)
   */
  static async getComments(event: H3Event, postId: string): Promise<{ comments: any[]; total_count: number }> {
    const supabase = await getSupabaseClient(event);

    try {
      // 게시글 존재 여부 확인
      const postExists = await postHelpers.exists(supabase, postId);
      if (!postExists) {
        throw errors.postNotFound();
      }

      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          id, post_id, parent_id, content, nickname, depth,
          like_count, reply_count, is_author, is_deleted,
          created_at, updated_at
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        handleSupabaseError(error, '댓글 목록 조회');
      }

      // 계층 구조로 변환
      const commentTree = this.buildCommentTree(comments || []);

      return {
        comments: commentTree,
        total_count: comments?.length || 0
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 목록 조회');
  // 위 함수는 never 반환이지만 TS 보장용
  throw errors.internal('댓글 목록 조회 실패');
    }
  }

  /**
   * 최근 댓글 조회
   */
  static async getRecentComments(event: H3Event, limit: number = 10) {
    const supabase = await getSupabaseClient(event);

    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          id, content, nickname, post_id, is_author,
          created_at,
          posts!inner (
            id, title, is_deleted
          )
        `)
        .eq('is_deleted', false)
        .eq('posts.is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        handleSupabaseError(error, '최근 댓글 조회');
      }

      // 데이터 변환
  const recentComments = (comments || []).map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        nickname: comment.nickname,
        post_id: comment.post_id,
        post_title: (comment.posts as any).title,
        is_author: comment.is_author,
        depth: 0,
        created_at: comment.created_at
      }));

      return recentComments;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '최근 댓글 조회');
    }
  }

  /**
   * 댓글 생성
   */
  static async createComment(event: H3Event, data: CreateCommentData) {
    const supabase = await getSupabaseClient(event);
    const { postId, parentId, content, nickname, password, isAuthor } = data;

    try {
      // 게시글 존재 여부 확인
      const postExists = await postHelpers.exists(supabase, postId);
      if (!postExists) {
        throw errors.postNotFound();
      }

      // 부모 댓글 확인 및 깊이 계산
      let depth = 0;
      if (parentId) {
        const parentExists = await commentHelpers.exists(supabase, parentId);
        if (!parentExists) {
          throw errors.commentNotFound();
        }
        
        depth = await commentHelpers.getParentDepth(supabase, parentId);
        
        // 최대 깊이 제한 (10레벨)
        if (depth > 10) {
          throw errors.validation('댓글 깊이가 제한을 초과했습니다.');
        }
      }

      // 비밀번호 해싱
      const passwordHash = await hashPassword(password);

      // 댓글 생성
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_id: parentId || null,
          content: content.trim(),
          nickname: nickname.trim(),
          password_hash: passwordHash,
          depth,
          is_author: isAuthor || false
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, '댓글 생성');
      }

      // 게시글의 댓글 수 업데이트
      await commentHelpers.updatePostCommentCount(supabase, postId);

      // 부모 댓글의 답글 수 업데이트
      if (parentId) {
        await this.updateParentReplyCount(supabase, parentId);
      }

      return comment;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 생성');
    }
  }

  /**
   * 댓글 수정
   */
  static async updateComment(event: H3Event, commentId: string, data: UpdateCommentData) {
    const supabase = await getSupabaseClient(event);
    const { content, password } = data;

    try {
      // 비밀번호 확인
      const isValidPassword = await commentHelpers.verifyPassword(supabase, commentId, password);
      if (!isValidPassword) {
        throw errors.invalidPassword();
      }

      // 댓글 수정
      const { data: updatedComment, error } = await supabase
        .from('comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, '댓글 수정');
      }

      if (!updatedComment) {
        throw errors.commentNotFound();
      }

      return updatedComment;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 수정');
    }
  }

  /**
   * 댓글 삭제
   */
  static async deleteComment(event: H3Event, commentId: string, password: string) {
    const supabase = await getSupabaseClient(event);

    try {
      // 비밀번호 확인
      const isValidPassword = await commentHelpers.verifyPassword(supabase, commentId, password);
      if (!isValidPassword) {
        throw errors.invalidPassword();
      }

      // 댓글 정보 조회 (게시글 ID와 부모 ID 필요)
      const { data: commentInfo, error: fetchError } = await supabase
        .from('comments')
        .select('post_id, parent_id')
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single();

      if (fetchError) {
        handleSupabaseError(fetchError, '댓글 정보 조회');
      }

      if (!commentInfo) {
        throw errors.commentNotFound();
      }

      // 소프트 삭제
      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) {
        handleSupabaseError(error, '댓글 삭제');
      }

      // 게시글의 댓글 수 업데이트
      await commentHelpers.updatePostCommentCount(supabase, commentInfo.post_id);

      // 부모 댓글의 답글 수 업데이트
      if (commentInfo.parent_id) {
        await this.updateParentReplyCount(supabase, commentInfo.parent_id);
      }

      return { success: true };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 삭제');
    }
  }

  /**
   * 댓글 비밀번호 확인
   */
  static async verifyPassword(event: H3Event, commentId: string, password: string) {
    const supabase = await getSupabaseClient(event);
    
    try {
      const isValid = await commentHelpers.verifyPassword(supabase, commentId, password);
      return { valid: isValid };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 비밀번호 확인');
    }
  }

  /**
   * 댓글 좋아요 토글
   */
  static async toggleLike(event: H3Event, commentId: string) {
    const supabase = await getSupabaseClient(event);

    try {
      // 현재 좋아요 수 조회
      const { data: currentComment, error: fetchError } = await supabase
        .from('comments')
        .select('like_count')
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single();

      if (fetchError) {
        handleSupabaseError(fetchError, '댓글 조회');
      }

      if (!currentComment) {
        throw errors.commentNotFound();
      }

      // 좋아요 수 증가 (간단히 구현)
      const newLikeCount = (currentComment.like_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('comments')
        .update({ like_count: newLikeCount })
        .eq('id', commentId);

      if (updateError) {
        handleSupabaseError(updateError, '댓글 좋아요 업데이트');
      }

      return {
        liked: true,
        likeCount: newLikeCount
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 좋아요 처리');
    }
  }

  /**
   * 댓글 트리 구조 생성
   */
  private static buildCommentTree(comments: any[]): any[] {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // 댓글을 ID로 매핑
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    // 트리 구조 생성
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  /**
   * 부모 댓글의 답글 수 업데이트
   */
  private static async updateParentReplyCount(supabase: any, parentId: string) {
    try {
      const { error } = await supabase.rpc('update_comment_reply_count', {
        comment_id: parentId
      });

      if (error) {
        console.error('Reply count update failed:', error);
      }
    } catch (error) {
      console.error('Reply count update error:', error);
    }
  }
}