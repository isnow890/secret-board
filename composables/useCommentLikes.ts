// composables/useCommentLikes.ts
import type { Comment } from '~/types'

export const useCommentLikes = () => {
  // 댓글 좋아요 토글 (낙관적 업데이트 지원)
  const toggleCommentLike = async (commentId: string, currentLikeCount: number = 0) => {
    try {
      const { toggleCommentLike: toggleLike } = useLocalStorage()
      
      // toggleCommentLike는 새로운 상태를 반환 (true: 좋아요 추가, false: 좋아요 취소)
      const newLikedState = toggleLike(commentId)
      
      // 낙관적 업데이트용 새로운 카운트 계산
      const optimisticCount = newLikedState
        ? currentLikeCount + 1
        : Math.max(0, currentLikeCount - 1)
      
      try {
        // 서버에 좋아요 상태 전달
        const response = await $fetch(`/api/comments/${commentId}/like`, {
          method: 'POST',
          body: { liked: newLikedState },
        })
        
        if (response?.success && response.data) {
          return {
            success: true,
            isLiked: newLikedState,
            likeCount: response.data.like_count ?? optimisticCount,
            data: response.data
          }
        }
        
        return {
          success: false,
          isLiked: newLikedState,
          likeCount: optimisticCount
        }
      } catch (serverError) {
        console.error('서버 좋아요 처리 실패:', serverError)
        // 서버 오류 시 localStorage 상태 롤백
        toggleLike(commentId) // 다시 토글해서 원래 상태로 복원
        throw serverError
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error)
      throw error
    }
  }

  // 댓글 목록에서 특정 댓글의 좋아요 수 업데이트
  const updateCommentLikeCount = (
    commentList: Comment[], 
    commentId: string, 
    newLikeCount: number
  ): boolean => {
    for (const comment of commentList) {
      if (comment.id === commentId) {
        comment.like_count = newLikeCount
        return true
      }

      if (comment.replies && comment.replies.length > 0) {
        if (updateCommentLikeCount(comment.replies, commentId, newLikeCount)) {
          return true
        }
      }
    }
    return false
  }

  // 서버 전용 댓글 좋아요 (기존 로직 유지)
  const likeCommentServer = async (commentId: string) => {
    try {
      const response = await $fetch(`/api/comments/${commentId}/like`, {
        method: 'POST'
      })

      if (response?.success && response.data) {
        return response.data
      }
      return null
    } catch (err: any) {
      console.error('댓글 좋아요 실패:', err)
      
      useToast().add({
        title: '좋아요 실패',
        description: '잠시 후 다시 시도해주세요.',
        color: 'red'
      })
      
      throw err
    }
  }

  return {
    toggleCommentLike,
    updateCommentLikeCount,
    likeCommentServer
  }
}