/**
 * 브라우저 localStorage를 안전하게 관리하는 컴포저블
 * 
 * 주요 기능:
 * - 게시글 읽음 상태 추적
 * - 좋아요 상태 지속 저장
 * - 조회수 중복 방지 (24시간 단위)
 * - SSR 환경 안전성 보장
 * - 에러 처리 및 데이터 무결성
 * 
 * @author Hit Secret Team
 */

import type { LocalStorageData } from '~/types'

/**
 * localStorage 데이터 관리 컴포저블
 * 브라우저 환경에서 사용자 상태를 지속적으로 관리
 */
export const useLocalStorage = () => {
  // === 기본 설정 ===
  
  /** localStorage에 저장될 데이터의 기본값 */
  const defaultData: LocalStorageData = {
    board_viewed_posts: [],
    board_liked_posts: [],
    board_liked_comments: [],
    board_view_timestamps: {},
    board_last_page: 1,
    board_last_params: {},
    board_comment_nicknames: {}
  }

  // === 핵심 유틸리티 ===
  
  /**
   * localStorage에서 데이터를 안전하게 읽어옴
   * SSR 환경과 에러 상황을 고려하여 안전하게 처리
   * @param key localStorage 키
   * @param fallback 에러 시 반환할 기본값
   * @returns 저장된 데이터 또는 기본값
   */
  const getStorageData = <T>(key: keyof LocalStorageData, fallback: T): T => {
    if (process.server) return fallback
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch (error) {
      console.error(`localStorage 읽기 실패 (${key}):`, error)
      return fallback
    }
  }

  /**
   * localStorage에 데이터를 안전하게 저장
   * JSON 직렬화 오류와 저장 공간 부족 등을 고려
   * @param key localStorage 키
   * @param data 저장할 데이터
   */
  const setStorageData = <T>(key: keyof LocalStorageData, data: T): void => {
    if (process.server) return
    
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`localStorage 쓰기 실패 (${key}):`, error)
    }
  }

  // === 게시글 읽음 상태 관리 ===
  
  /**
   * 게시글을 읽음 목록에 추가
   * 중복 방지 기능 포함
   * @param postId 읽은 게시글 ID
   */
  const addViewedPost = (postId: string): void => {
    const viewedPosts = getStorageData('board_viewed_posts', defaultData.board_viewed_posts)
    if (!viewedPosts.includes(postId)) {
      viewedPosts.push(postId)
      setStorageData('board_viewed_posts', viewedPosts)
    }
  }

  /**
   * 게시글을 이미 읽었는지 확인
   * UI에서 읽은 게시글을 다르게 표시할 때 사용
   * @param postId 확인할 게시글 ID
   * @returns 읽음 여부
   */
  const isPostViewed = (postId: string): boolean => {
    const viewedPosts = getStorageData('board_viewed_posts', defaultData.board_viewed_posts)
    return viewedPosts.includes(postId)
  }

  // === 게시글 좋아요 관리 ===
  
  /**
   * 게시글 좋아요 상태를 토글
   * @param postId 토글할 게시글 ID
   * @returns 토글 후 좋아요 상태 (true: 좋아요, false: 좋아요 취소)
   */
  const togglePostLike = (postId: string): boolean => {
    const likedPosts = getStorageData('board_liked_posts', defaultData.board_liked_posts)
    const index = likedPosts.indexOf(postId)
    
    if (index > -1) {
      likedPosts.splice(index, 1)
      setStorageData('board_liked_posts', likedPosts)
      return false
    } else {
      likedPosts.push(postId)
      setStorageData('board_liked_posts', likedPosts)
      return true
    }
  }

  /**
   * 게시글에 좋아요를 눌렀는지 확인
   * @param postId 확인할 게시글 ID
   * @returns 좋아요 여부
   */
  const isPostLiked = (postId: string): boolean => {
    const likedPosts = getStorageData('board_liked_posts', defaultData.board_liked_posts)
    return likedPosts.includes(postId)
  }

  // === 댓글 좋아요 관리 ===
  
  /**
   * 댓글을 좋아요 목록에 추가
   * 중복 방지 기능 포함
   * @param commentId 좋아요를 추가할 댓글 ID
   */
  const addLikedComment = (commentId: string): void => {
    const likedComments = getStorageData('board_liked_comments', defaultData.board_liked_comments)
    if (!likedComments.includes(commentId)) {
      likedComments.push(commentId)
      setStorageData('board_liked_comments', likedComments)
    }
  }

  /**
   * 댓글에 좋아요를 눌렀는지 확인
   * @param commentId 확인할 댓글 ID
   * @returns 좋아요 여부
   */
  const isCommentLiked = (commentId: string): boolean => {
    const likedComments = getStorageData('board_liked_comments', defaultData.board_liked_comments)
    return likedComments.includes(commentId)
  }

  /**
   * 댓글을 좋아요 목록에서 제거
   * @param commentId 제거할 댓글 ID
   */
  const removeLikedComment = (commentId: string): void => {
    const likedComments = getStorageData('board_liked_comments', defaultData.board_liked_comments)
    const index = likedComments.indexOf(commentId)
    if (index > -1) {
      likedComments.splice(index, 1)
      setStorageData('board_liked_comments', likedComments)
    }
  }

  /**
   * 댓글 좋아요 상태를 토글
   * @param commentId 토글할 댓글 ID
   * @returns 토글 후 좋아요 상태 (true: 좋아요, false: 좋아요 취소)
   */
  const toggleCommentLike = (commentId: string): boolean => {
    const likedComments = getStorageData('board_liked_comments', defaultData.board_liked_comments)
    const index = likedComments.indexOf(commentId)
    
    if (index > -1) {
      likedComments.splice(index, 1)
      setStorageData('board_liked_comments', likedComments)
      return false
    } else {
      likedComments.push(commentId)
      setStorageData('board_liked_comments', likedComments)
      return true
    }
  }

  // === 조회수 중복 방지 ===
  
  /**
   * 게시글 조회 시간을 기록
   * 24시간 중복 조회수 증가 방지를 위해 사용
   * @param postId 조회 시간을 기록할 게시글 ID
   */
  const updateViewTimestamp = (postId: string): void => {
    const timestamps = getStorageData('board_view_timestamps', defaultData.board_view_timestamps)
    timestamps[postId] = Date.now()
    setStorageData('board_view_timestamps', timestamps)
  }

  /**
   * 게시글 조회수를 증가시켜도 되는지 확인
   * 24시간 이내 중복 조회 방지
   * @param postId 확인할 게시글 ID
   * @returns 조회수 증가 가능 여부
   */
  const canIncrementView = (postId: string): boolean => {
    const timestamps = getStorageData('board_view_timestamps', defaultData.board_view_timestamps)
    const lastViewTime = timestamps[postId]
    
    if (!lastViewTime) return true
    
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000
    
    return (now - lastViewTime) > dayInMs
  }

  // === 데이터 관리 ===
  
  /**
   * 모든 localStorage 데이터를 삭제
   * 사용자 데이터 초기화 또는 로그아웃 시 사용
   */
  const clearAllData = (): void => {
    Object.keys(defaultData).forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error(`localStorage 삭제 실패 (${key}):`, error)
      }
    })
  }

  // === 게시글별 댓글 닉네임 관리 ===
  
  /**
   * 게시글별 댓글 닉네임을 저장
   * @param postId 게시글 ID
   * @param nickname 저장할 닉네임
   */
  const saveCommentNickname = (postId: string, nickname: string): void => {
    const commentNicknames = getStorageData('board_comment_nicknames', defaultData.board_comment_nicknames)
    commentNicknames[postId] = nickname
    setStorageData('board_comment_nicknames', commentNicknames)
  }

  /**
   * 게시글별로 저장된 댓글 닉네임을 조회
   * @param postId 게시글 ID
   * @returns 저장된 닉네임 (없으면 null)
   */
  const getCommentNickname = (postId: string): string | null => {
    const commentNicknames = getStorageData('board_comment_nicknames', defaultData.board_comment_nicknames)
    return commentNicknames[postId] || null
  }

  /**
   * 모든 localStorage 데이터를 내보내기
   * 데이터 백업이나 디버깅 때 사용
   * @returns 전체 localStorage 데이터
   */
  const exportData = (): LocalStorageData => {
    return {
      board_viewed_posts: getStorageData('board_viewed_posts', defaultData.board_viewed_posts),
      board_liked_posts: getStorageData('board_liked_posts', defaultData.board_liked_posts),
      board_liked_comments: getStorageData('board_liked_comments', defaultData.board_liked_comments),
      board_view_timestamps: getStorageData('board_view_timestamps', defaultData.board_view_timestamps),
      board_last_page: getStorageData('board_last_page', defaultData.board_last_page),
      board_last_params: getStorageData('board_last_params', defaultData.board_last_params),
      board_comment_nicknames: getStorageData('board_comment_nicknames', defaultData.board_comment_nicknames)
    }
  }

  return {
    // 게시글 관련
    addViewedPost,
    isPostViewed,
    togglePostLike,
    isPostLiked,
    
    // 댓글 관련
    addLikedComment,
    isCommentLiked,
    removeLikedComment,
    toggleCommentLike,
    
    // 게시글별 댓글 닉네임 관리
    saveCommentNickname,
    getCommentNickname,
    
    // 조회 시간 관련
    updateViewTimestamp,
    canIncrementView,
    
    // 유틸리티
    getStorageData,
    setStorageData,
    clearAllData,
    exportData
  }
}