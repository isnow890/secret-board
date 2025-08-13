// server/utils/database.ts
import bcrypt from 'bcryptjs';
import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/supabase';
import type { H3Event } from 'h3';
import { errors, handleSupabaseError, handleBcryptError } from './errorHandler';
// import { stripHtml } from './textUtils'; // (미사용)

/**
 * Supabase 클라이언트 가져오기
 */
export const getSupabaseClient = async (event: H3Event): Promise<any> => {
  try {
    return await serverSupabaseClient<Database>(event);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw errors.internal('데이터베이스 연결에 실패했습니다.');
  }
};

/**
 * 비밀번호 해싱
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    handleBcryptError(error);
    throw errors.internal('비밀번호 해싱 실패');
  }
};

/**
 * 비밀번호 검증
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    handleBcryptError(error);
    throw errors.internal('비밀번호 검증 실패');
  }
};

/**
 * HTML 콘텐츠 정리 및 텍스트 추출
 */
export const processContent = (htmlContent: string) => {
  // HTML 정리 함수가 없어서 기본 정리만 수행
  const cleanContent = sanitizeHtml(htmlContent);
  const plainText = cleanContent.replace(/<[^>]*>/g, '').trim();
  
  return {
    cleanContent,
    plainText,
    textLength: plainText.length
  };
};

/**
 * 기본 HTML 정리 (DOMPurify 대체)
 */
const sanitizeHtml = (html: string): string => {
  let cleaned = html;
  
  // 위험한 태그 제거
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  cleaned = cleaned.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  cleaned = cleaned.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  
  // 이벤트 핸들러 제거
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');
  
  // javascript: URL 제거
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  cleaned = cleaned.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  return cleaned;
};

/**
 * 게시글 관련 데이터베이스 헬퍼
 */
export const postHelpers = {
  /**
   * 게시글 존재 여부 확인
   */
  async exists(supabase: any, postId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, '게시글 확인');
      }
      
      return !!data;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '게시글 확인');
      throw errors.internal('게시글 확인 실패');
    }
  },

  /**
   * 게시글 비밀번호 확인
   */
  async verifyPassword(supabase: any, postId: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('password_hash')
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();
      
      if (error) {
        handleSupabaseError(error, '게시글 비밀번호 확인');
      }
      
      if (!data) {
        throw errors.postNotFound();
      }
      
      return await verifyPassword(password, data.password_hash);
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '게시글 비밀번호 확인');
      throw errors.internal('게시글 비밀번호 확인 실패');
    }
  },

  /**
   * 조회수 증가
   */
  async incrementViewCount(supabase: any, postId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_post_view_count', {
        post_id: postId
      });
      
      if (error) {
        console.error('View count increment failed:', error);
        // 조회수 증가는 실패해도 전체 요청을 실패시키지 않음
      }
    } catch (error) {
      console.error('View count increment error:', error);
      // 조회수 증가 실패는 무시
    }
  },

  /**
   * 좋아요 토글
   */
  async toggleLike(supabase: any, postId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      // 현재 좋아요 수 조회
      const { data: currentPost, error: fetchError } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();
      
      if (fetchError) {
        handleSupabaseError(fetchError, '좋아요 조회');
      }
      
      if (!currentPost) {
        throw errors.postNotFound();
      }
      
      // 좋아요 토글 (간단히 증가만 구현)
      const newLikeCount = (currentPost.like_count || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ like_count: newLikeCount })
        .eq('id', postId);
      
      if (updateError) {
        handleSupabaseError(updateError, '좋아요 업데이트');
      }
      
      return {
        liked: true,
        likeCount: newLikeCount
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '좋아요 토글');
      throw errors.internal('게시글 좋아요 토글 실패');
    }
  }
};

/**
 * 댓글 관련 데이터베이스 헬퍼
 */
export const commentHelpers = {
  /**
   * 댓글 존재 여부 확인
   */
  async exists(supabase: any, commentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id')
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, '댓글 확인');
      }
      
      return !!data;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 확인');
      throw errors.internal('댓글 확인 실패');
    }
  },

  /**
   * 댓글 비밀번호 확인
   */
  async verifyPassword(supabase: any, commentId: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('password_hash')
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single();
      
      if (error) {
        handleSupabaseError(error, '댓글 비밀번호 확인');
      }
      
      if (!data) {
        throw errors.commentNotFound();
      }
      
      return await verifyPassword(password, data.password_hash);
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '댓글 비밀번호 확인');
      throw errors.internal('댓글 비밀번호 확인 실패');
    }
  },

  /**
   * 부모 댓글의 깊이 계산
   */
  async getParentDepth(supabase: any, parentId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('depth')
        .eq('id', parentId)
        .single();
      
      if (error) {
        handleSupabaseError(error, '부모 댓글 조회');
      }
      
      return (data?.depth || 0) + 1;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '부모 댓글 조회');
      throw errors.internal('부모 댓글 조회 실패');
    }
  },

  /**
   * 댓글 수 업데이트
   */
  async updatePostCommentCount(supabase: any, postId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_post_comment_count', {
        post_id: postId
      });
      
      if (error) {
        console.error('Comment count update failed:', error);
        // 댓글 수 업데이트 실패는 무시 (DB 트리거로 처리됨)
      }
    } catch (error) {
      console.error('Comment count update error:', error);
    }
  }
};

/**
 * 파일 관련 헬퍼
 */
export const fileHelpers = {
  /**
   * 허용된 이미지 타입 확인
   */
  isValidImageType(contentType: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(contentType.toLowerCase());
  },

  /**
   * 파일 크기 확인
   */
  isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
    return size <= maxSizeMB * 1024 * 1024;
  },

  /**
   * 안전한 파일명 생성
   */
  generateSafeFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    return `${timestamp}_${random}.${ext}`;
  }
};