/**
 * 댓글 관리를 위한 컴포저블
 * 
 * 주요 기능:
 * - 계층형 댓글 시스템 (대댓글 지원)
 * - 댓글 생성, 수정, 삭제
 * - 댓글 좋아요 기능
 * - 실시간 댓글 수 동기화
 * - 소프트 삭제와 하드 삭제 처리
 * 
 * @param postId 게시글 ID
 * @author Hit Secret Team
 */

import { ref, readonly } from 'vue'
import type { Comment, CreateCommentRequest, ApiResponse } from '~/types'

/**
 * 댓글 관리를 위한 컴포저블
 * @param postId 댓글을 관리할 게시글의 ID
 */
export const useComments = (postId: string) => {
  // === 의존성 관리 ===
  
  /** 댓글 수 글로벌 상태 관리를 위한 Pinia 스토어 */
  const commentsStore = useCommentsStore()
  
  /** 댓글 좋아요 기능 관리 */
  const { likeCommentServer, updateCommentLikeCount } = useCommentLikes()
  
  // === 상태 관리 ===
  
  /** 댓글 목록 (계층형 구조) */
  const comments = ref<Comment[]>([])
  
  /** 댓글 로딩 상태 */
  const loading = ref(false)
  
  /** 에러 메시지 */
  const error = ref('')
  
  /** 전체 댓글 수 (대댓글 포함) */
  const totalCount = ref(0)

  // === 댓글 조회 ===
  
  /**
   * 게시글의 모든 댓글을 조회 - $fetch 버전으로 변경
   * 계층형 구조로 댓글과 대댓글을 함께 가져옴
   */
  const fetchComments = async () => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await $fetch(`/api/comments/${postId}`) as ApiResponse<Comment[]>;

      if (response?.success) {
        if (Array.isArray(response.data)) {
          comments.value = response.data;
          totalCount.value = (response as any).meta?.total || response.data.length;
        } else if (response.data && typeof response.data === 'object' && 'comments' in response.data) {
          comments.value = (response.data as any).comments || [];
          totalCount.value = (response.data as any).comments?.length || 0;
        } else {
          comments.value = [];
          totalCount.value = 0;
        }
        // Pinia 스토어에도 댓글 수 업데이트
        commentsStore.updateCommentCount(postId, totalCount.value);
      }
    } catch (fetchError: any) {
      console.error('댓글 조회 실패:', fetchError);
      error.value = fetchError.statusMessage || '댓글을 불러오는 중 오류가 발생했습니다.';
      
      useToast().add({
        title: '댓글 조회 실패',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  }

  // === 댓글 작성 ===
  
  /**
   * 새로운 댓글을 작성
   * @param commentData 댓글 작성 정보 (내용, 닉네임, 비밀번호 등)
   * @returns 생성된 댓글 데이터
   */
  const createComment = async (commentData: CreateCommentRequest) => {
    try {
      const response = await $fetch('/api/comments', {
        method: 'POST',
        body: commentData
      })

      if (response?.success && response.data) {
        // 새 댓글을 목록에 추가
        if (response.data && typeof response.data === 'object' && 'id' in response.data) {
          // Ensure all required Comment properties exist
          const newComment: Comment = {
            id: response.data.id,
            post_id: response.data.post_id,
            parent_id: response.data.parent_id,
            content: response.data.content,
            nickname: response.data.nickname,
            password_hash: response.data.password_hash,
            like_count: response.data.like_count || 0,
            depth: response.data.depth || 0,
            reply_count: response.data.reply_count || 0,
            is_author: response.data.is_author || false,
            is_deleted: response.data.is_deleted || false,
            deleted_at: response.data.deleted_at || null,
            created_at: response.data.created_at || new Date().toISOString(),
            updated_at: response.data.updated_at || new Date().toISOString(),
            replies: []
          };
          comments.value.push(newComment);
        }
        totalCount.value++
        
        // Pinia 스토어에 댓글 수 증가
        commentsStore.incrementCommentCount(postId)

        return response.data
      }
    } catch (err: any) {
      console.error('댓글 작성 실패:', err)
      
      // 글쓴이 비밀번호 에러에 대한 특별 처리
      if (err.statusCode === 401 && err.statusMessage === '글쓴이 비밀번호가 틀렸습니다.') {
        useToast().add({
          title: '글쓴이 비밀번호가 틀렸습니다',
          description: '게시글 작성 시 사용한 비밀번호를 입력해주세요.',
          color: 'red'
        })
      } else {
        useToast().add({
          title: '댓글 작성에 실패했습니다',
          description: err.statusMessage || '잠시 후 다시 시도해주세요.',
          color: 'red'
        })
      }
      
      throw err
    }
  }

  /**
   * 특정 댓글에 대한 답글을 작성
   * @param replyData 답글 작성 정보
   * @param parentId 부모 댓글의 ID
   * @returns 생성된 답글 데이터
   */
  const createReply = async (replyData: CreateCommentRequest, parentId: string) => {
    try {
      const response = await createComment(replyData)
      
      if (response) {
        // 부모 댓글 찾아서 답글 추가
        const findAndAddReply = (commentList: Comment[]): boolean => {
          for (const comment of commentList) {
            if (comment.id === parentId) {
              if (!comment.replies) {
                comment.replies = []
              }
              if (response && typeof response === 'object' && 'id' in response) {
                // Create a proper Comment object for the reply
                const newReply: Comment = {
                  id: response.id,
                  post_id: response.post_id || '',
                  parent_id: response.parent_id,
                  content: response.content || '',
                  nickname: response.nickname || '',
                  password_hash: response.password_hash || '',
                  like_count: response.like_count || 0,
                  depth: response.depth || 0,
                  reply_count: response.reply_count || 0,
                  is_author: response.is_author || false,
                  is_deleted: response.is_deleted || false,
                  deleted_at: response.deleted_at || null,
                  created_at: response.created_at || new Date().toISOString(),
                  updated_at: response.updated_at || new Date().toISOString(),
                  replies: []
                };
                comment.replies.push(newReply);
              }
              comment.reply_count++
              return true
            }

            if (comment.replies && comment.replies.length > 0) {
              if (findAndAddReply(comment.replies)) {
                return true
              }
            }
          }
          return false
        }

        findAndAddReply(comments.value)
        
        // Pinia 스토어에 댓글 수 증가 (답글도 댓글 수에 포함)
        commentsStore.incrementCommentCount(postId)
      }
      
      return response
    } catch (err: any) {
      console.error('답글 작성 실패:', err)
      
      // 글쓴이 비밀번호 에러에 대한 특별 처리
      if (err.statusCode === 401 && err.statusMessage === '글쓴이 비밀번호가 틀렸습니다.') {
        useToast().add({
          title: '글쓴이 비밀번호가 틀렸습니다',
          description: '게시글 작성 시 사용한 비밀번호를 입력해주세요.',
          color: 'red'
        })
      } else {
        useToast().add({
          title: '답글 작성에 실패했습니다',
          description: err.statusMessage || '잠시 후 다시 시도해주세요.',
          color: 'red'
        })
      }
      
      throw err
    }
  }

  // === 댓글 좋아요 ===
  
  /**
   * 댓글에 좋아요를 추가/취소
   * 서버에서 좋아요 처리 후 로컬 상태 업데이트
   * @param commentId 좋아요를 처리할 댓글 ID
   * @returns 좋아요 처리 결과 (좋아요 수 포함)
   */
  const likeComment = async (commentId: string) => {
    try {
      const result = await likeCommentServer(commentId)
      
      if (result) {
        // 댓글 목록에서 해당 댓글 찾아서 좋아요 수 업데이트
        updateCommentLikeCount(comments.value, commentId, result.like_count ?? 0)
        return result
      }
      return null
    } catch (err) {
      throw err
    }
  }

  // === 댓글 인증 ===
  
  /**
   * 댓글의 비밀번호를 확인
   * 댓글 수정/삭제 전에 소유권 검증용
   * @param commentId 확인할 댓글 ID
   * @param password 입력된 비밀번호
   * @returns 비밀번호 일치 여부
   */
  const verifyCommentPassword = async (commentId: string, password: string) => {
    try {
      const response = await $fetch(`/api/comments/${commentId}/verify`, {
        method: 'POST',
        body: { password }
      })
      return response?.success || false
    } catch (err: any) {
      console.error('댓글 비밀번호 확인 실패:', err)
      throw err
    }
  }

  // === 댓글 수정 ===
  
  /**
   * 댓글 내용을 수정
   * 비밀번호 확인 후 내용 업데이트
   * @param commentId 수정할 댓글 ID
   * @param content 새로운 댓글 내용
   * @param password 댓글 비밀번호
   * @returns 수정된 댓글 데이터
   */
  const editComment = async (commentId: string, content: string, password: string) => {
    try {
      const response = await $fetch(`/api/comments/${commentId}/edit`, {
        method: 'POST',
        body: { content, password }
      })

      if (response?.success && response.data) {
        // 댓글 목록에서 해당 댓글 찾아서 내용 업데이트
        const updateCommentContent = (commentList: Comment[]): boolean => {
          for (const comment of commentList) {
            if (comment.id === commentId && response.data) {
              comment.content = response.data.content || comment.content
              comment.updated_at = response.data.updated_at || comment.updated_at || new Date().toISOString()
              return true
            }

            if (comment.replies && comment.replies.length > 0) {
              if (updateCommentContent(comment.replies)) {
                return true
              }
            }
          }
          return false
        }

        updateCommentContent(comments.value)
        return response.data
      }
      return null
    } catch (err: any) {
      console.error('댓글 수정 실패:', err)
      throw err
    }
  }

  // === 댓글 삭제 ===
  
  /**
   * 댓글을 삭제 (소프트 삭제 또는 하드 삭제)
   * 답글이 있는 경우 소프트 삭제, 없는 경우 하드 삭제
   * @param commentId 삭제할 댓글 ID
   * @param password 댓글 비밀번호
   * @param showToast 토스트 메시지 표시 여부 (기본값: false)
   * @returns 삭제 처리 결과
   */
  const deleteComment = async (commentId: string, password: string, showToast: boolean = false) => {
    try {
      const response = await $fetch(`/api/comments/${commentId}/delete`, {
        method: 'POST',
        body: { password }
      })

      if (response?.success && response.data) {
        const { deleted, soft_deleted } = response.data

        if (soft_deleted) {
          // 소프트 삭제: 내용만 변경
          const updateCommentContent = (commentList: Comment[]): boolean => {
            for (const comment of commentList) {
              if (comment.id === commentId) {
                comment.content = '삭제된 댓글입니다.'
                return true
              }

              if (comment.replies && comment.replies.length > 0) {
                if (updateCommentContent(comment.replies)) {
                  return true
                }
              }
            }
            return false
          }

          updateCommentContent(comments.value)
        } else if (deleted) {
          // 하드 삭제: 댓글 완전히 제거
          const removeComment = (commentList: Comment[]): Comment[] => {
            return commentList.filter(comment => {
              if (comment.id === commentId) {
                totalCount.value--
                // Pinia 스토어에서 댓글 수 감소
                commentsStore.updateCommentCount(postId, totalCount.value)
                return false
              }

              if (comment.replies && comment.replies.length > 0) {
                const originalLength = comment.replies.length
                comment.replies = removeComment(comment.replies)
                if (comment.replies.length !== originalLength) {
                  comment.reply_count = comment.replies.length
                }
              }

              return true
            })
          }

          comments.value = removeComment(comments.value)
        }

        if (showToast) {
          useToast().add({
            title: '댓글이 삭제되었습니다'
          })
        }

        return response
      }
      return null
    } catch (err: any) {
      console.error('댓글 삭제 실패:', err)
      
      if (showToast) {
        const errorMessage = err.statusMessage === '비밀번호가 일치하지 않습니다.' 
          ? '비밀번호가 일치하지 않습니다.'
          : '댓글 삭제 중 오류가 발생했습니다.'
        
        useToast().add({
          title: '댓글 삭제 실패',
          description: errorMessage,
          color: 'red'
        })
      }
      
      throw err
    }
  }

  // === 유틸리티 ===
  
  /**
   * 댓글 목록을 새로고침
   * 서버에서 최신 댓글 데이터를 다시 가져옴
   */
  const refresh = async () => {
    await fetchComments();
  }

  return {
    // 상태
    comments: readonly(comments),
    loading: readonly(loading),
    error: readonly(error),
    totalCount: readonly(totalCount),
    
    // 메서드
    fetchComments,
    createComment,
    createReply,
    likeComment,
    verifyCommentPassword,
    editComment,
    deleteComment,
    refresh
  }
}