// server/services/postService.ts
import type { H3Event } from 'h3';
import { 
  getSupabaseClient, 
  hashPassword, 
  processContent, 
  postHelpers 
} from '~/server/utils/database';
import { errors, handleSupabaseError } from '~/server/utils/errorHandler';
import type { CreatePostData, UpdatePostData } from '~/server/utils/validation';

/**
 * 게시글 서비스 클래스
 */
export class PostService {
  
  /**
   * 게시글 목록 조회
   */
  static async getPosts(event: H3Event, params: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
  } = {}): Promise<{ posts: any[]; pagination: { currentPage: number; totalPages: number; totalCount: number; hasMore: boolean } }> {
    const supabase = await getSupabaseClient(event);
    const { page = 1, limit = 20, sort = 'created', search } = params;
    
    try {
      let query = supabase
        .from('posts')
        .select(`
          id, title, nickname, preview, view_count, like_count, 
          comment_count, created_at, has_attachments, attachment_count,
          ai_summary, summary_generated_at
        `)
        .eq('is_deleted', false)
        .gt('comment_count', 0); // 댓글이 있는 게시글만

      // 검색 조건 추가
      if (search?.trim()) {
        query = query.or(`title.ilike.%${search}%,plain_text.ilike.%${search}%`);
      }

      // 정렬 조건 추가
      switch (sort) {
        case 'activity':
          query = query.order('last_comment_at', { ascending: false });
          break;
        case 'likes':
          query = query.order('like_count', { ascending: false });
          break;
        case 'views':
          query = query.order('view_count', { ascending: false });
          break;
        case 'comments':
          query = query.order('comment_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // 페이지네이션 적용
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

  const { data: posts, error } = await query;

      if (error) {
        handleSupabaseError(error, '게시글 목록 조회');
      }

      // 총 개수 조회 (count와 함께)
      const { count: totalCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .gt('comment_count', 0);

      return {
        posts: posts || [],
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((totalCount || 0) / limit),
          totalCount: totalCount || 0,
          hasMore: (totalCount || 0) > page * limit
        }
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '게시글 목록 조회');
      throw errors.internal('게시글 목록 조회 실패');
    }
  }

  /**
   * 게시글 상세 조회
   */
  static async getPost(event: H3Event, postId: string): Promise<any> {
    const supabase = await getSupabaseClient(event);
    
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          id, title, nickname, content, attached_files, view_count,
          like_count, comment_count, created_at, updated_at, 
          last_comment_at, is_deleted, ai_summary, summary_generated_at
        `)
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        handleSupabaseError(error, '게시글 조회');
      }

      if (!post) {
        throw errors.postNotFound();
      }

      // 파생 필드 계산
      const { plainText } = processContent(post.content);
      const files = Array.isArray(post.attached_files) ? post.attached_files : [];

      return {
        ...post,
        preview: plainText.slice(0, 200),
        hasAttachments: files.length > 0,
        attachmentCount: files.length,
        attached_files: files
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '게시글 조회');
      throw errors.internal('게시글 조회 실패');
    }
  }

  /**
   * 게시글 생성
   */
  static async createPost(event: H3Event, data: CreatePostData): Promise<any> {
    const supabase = await getSupabaseClient(event);
    const { title, content, nickname, password, attachedFiles } = data;

    try {
      // 콘텐츠 처리
      const { cleanContent, plainText, textLength } = processContent(content);
      
      // 비밀번호 해싱
      const passwordHash = await hashPassword(password);

      // 게시글 생성
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          content: cleanContent,
          nickname: nickname.trim(),
          password_hash: passwordHash,
          plain_text: plainText,
          attached_files: attachedFiles || [],
          has_attachments: (attachedFiles?.length || 0) > 0,
          attachment_count: attachedFiles?.length || 0,
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, '게시글 생성');
      }

      // AI 요약 생성 (100자 이상인 경우)
      if (textLength >= 100) {
        // 백그라운드에서 AI 요약 생성
        await this.generateAiSummaryInBackground(post.id, title.trim(), cleanContent);
      }

      return post;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '게시글 생성');
      throw errors.internal('게시글 생성 실패');
    }
  }

  /**
   * 게시글 수정
   */
  static async updatePost(event: H3Event, postId: string, data: UpdatePostData): Promise<any> {
    const supabase = await getSupabaseClient(event);
    const { title, content, password, attachedFiles } = data;

    try {
      // 비밀번호 확인
      const isValidPassword = await postHelpers.verifyPassword(supabase, postId, password);
      if (!isValidPassword) {
        throw errors.invalidPassword();
      }

      const updateData: any = {};
      let shouldRegenerateAI = false;

      // 제목 업데이트
      if (title !== undefined) {
        updateData.title = title.trim();
        shouldRegenerateAI = true;
      }

      // 내용 업데이트
      if (content !== undefined) {
        const { cleanContent, plainText, textLength } = processContent(content);
        updateData.content = cleanContent;
        updateData.plain_text = plainText;
        shouldRegenerateAI = true;

        // AI 요약 재생성 필요 시 기존 요약 제거
        if (textLength >= 100) {
          updateData.ai_summary = null;
          updateData.summary_generated_at = null;
        }
      }

      // 첨부파일 업데이트
      if (attachedFiles !== undefined) {
        updateData.attached_files = attachedFiles;
        updateData.has_attachments = attachedFiles.length > 0;
        updateData.attachment_count = attachedFiles.length;
      }

      updateData.updated_at = new Date().toISOString();

      // 게시글 업데이트
      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, '게시글 수정');
      }

      if (!updatedPost) {
        throw errors.postNotFound();
      }

      // AI 요약 재생성
      if (shouldRegenerateAI && updateData.plain_text?.length >= 100) {
        await this.generateAiSummaryInBackground(
          postId, 
          updateData.title || title || updatedPost.title,
          updateData.content || updatedPost.content
        );
      }

      return updatedPost;
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '게시글 수정');
      throw errors.internal('게시글 수정 실패');
    }
  }

  /**
   * 게시글 삭제
   */
  static async deletePost(event: H3Event, postId: string, password: string): Promise<{ success: boolean }> {
    const supabase = await getSupabaseClient(event);

    try {
      // 비밀번호 확인
      const isValidPassword = await postHelpers.verifyPassword(supabase, postId, password);
      if (!isValidPassword) {
        throw errors.invalidPassword();
      }

      // 소프트 삭제
      const { error } = await supabase
        .from('posts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        handleSupabaseError(error, '게시글 삭제');
      }

      return { success: true };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '게시글 삭제');
      throw errors.internal('게시글 삭제 실패');
    }
  }

  /**
   * 비밀번호 확인
   */
  static async verifyPassword(event: H3Event, postId: string, password: string): Promise<{ valid: boolean }> {
    const supabase = await getSupabaseClient(event);
    
    try {
      const isValid = await postHelpers.verifyPassword(supabase, postId, password);
      return { valid: isValid };
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '비밀번호 확인');
      throw errors.internal('게시글 비밀번호 확인 실패');
    }
  }

  /**
   * 좋아요 토글
   */
  static async toggleLike(event: H3Event, postId: string): Promise<any> {
    const supabase = await getSupabaseClient(event);
    
    try {
      return await postHelpers.toggleLike(supabase, postId);
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '좋아요 처리');
      throw errors.internal('게시글 좋아요 처리 실패');
    }
  }

  /**
   * 조회수 증가
   */
  static async incrementViewCount(event: H3Event, postId: string): Promise<{ success: boolean }> {
    const supabase = await getSupabaseClient(event);
    
    try {
      await postHelpers.incrementViewCount(supabase, postId);
      return { success: true };
    } catch (error: any) {
      // 조회수 증가는 실패해도 전체 요청을 실패시키지 않음
      console.error('View count increment failed:', error);
      return { success: false };
    }
  }

  /**
   * 인기 게시글 조회
   */
  static async getTrendingPosts(event: H3Event, limit: number = 10): Promise<any[]> {
    const supabase = await getSupabaseClient(event);

    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id, title, nickname, view_count, like_count, 
          comment_count, created_at
        `)
        .eq('is_deleted', false)
        .gt('comment_count', 0)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) {
        handleSupabaseError(error, '인기 게시글 조회');
      }

      return posts || [];
    } catch (error: any) {
      if (error.statusCode) throw error;
      handleSupabaseError(error, '인기 게시글 조회');
      throw errors.internal('인기 게시글 조회 실패');
    }
  }

  /**
   * 백그라운드 AI 요약 생성
   */
  private static async generateAiSummaryInBackground(postId: string, title: string, content: string) {
    try {
      // AI 요약 생성 API 호출 (백그라운드)
      $fetch('/api/ai/summarize', {
        method: 'POST',
        body: {
          postId,
          title,
          content
        }
      }).catch(error => {
        console.error('Background AI summary generation failed:', error);
      });
    } catch (error) {
      console.error('Failed to trigger AI summary generation:', error);
    }
  }
}