import type { Comment } from '~/types'

/**
 * @description 댓글의 '좋아요' 기능과 관련된 로직을 관리하는 컴포저블입니다.
 * 낙관적 업데이트를 지원하여 빠른 UI 반응성을 제공합니다.
 */
export const useCommentLikes = () => {
  /**
   * @description 댓글 좋아요 상태를 토글합니다. UI를 먼저 업데이트(낙관적 업데이트)하고 서버에 변경 사항을 전송합니다.
   * @param {string} commentId - 좋아요를 토글할 댓글의 ID
   * @param {number} [currentLikeCount=0] - 현재 댓글의 좋아요 수
   * @returns {Promise<{success: boolean, isLiked: boolean, likeCount: number, data?: any}>} 좋아요 처리 결과
   */
  const toggleCommentLike = async (commentId: string, currentLikeCount: number = 0) => {
    try {
      const { toggleCommentLike: toggleLike } = useLocalStorage()
      
      const newLikedState = toggleLike(commentId)
      
      const optimisticCount = newLikedState
        ? currentLikeCount + 1
        : Math.max(0, currentLikeCount - 1)
      
      try {
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
        toggleLike(commentId) // 롤백
        throw serverError
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error)
      throw error
    }
  }

  /**
   * @description 재귀적으로 댓글 목록을 탐색하여 특정 댓글의 좋아요 수를 업데이트합니다.
   * @param {Comment[]} commentList - 전체 댓글 목록 (계층 구조)
   * @param {string} commentId - 업데이트할 댓글의 ID
   * @param {number} newLikeCount - 새로운 좋아요 수
   * @returns {boolean} 업데이트 성공 여부
   */
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

  /**
   * @description 서버에 댓글 좋아요를 요청하는 레거시 함수. (useComments에서 사용)
   * @param {string} commentId - 좋아요를 처리할 댓글 ID
   * @returns {Promise<any>} 서버 응답 데이터
   */
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