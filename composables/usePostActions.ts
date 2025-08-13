// composables/usePostActions.ts
import { ref } from 'vue'

export const usePostActions = (postId: string) => {
  const router = useRouter()
  
  // 상태 관리
  const showDeleteModal = ref(false)
  const deletePasswordDialogRef = ref()
  const showPasswordModal = ref(false)
  const isDeleting = ref(false)

  // 게시글 수정을 위한 비밀번호 인증
  const authenticateForEdit = async (password: string): Promise<boolean> => {
    try {
      const { verifyPostPassword } = usePost(postId)
      const isValid = await verifyPostPassword(password)

      if (isValid && process.client) {
        // 세션 스토리지에 인증 정보 저장 (1시간 유효)
        const authKey = `edit_auth_${postId}`
        const authData = {
          password,
          timestamp: Date.now(),
        }
        sessionStorage.setItem(authKey, JSON.stringify(authData))
      }

      return isValid
    } catch (error) {
      console.error('비밀번호 확인 실패:', error)
      return false
    }
  }

  // 목록으로 돌아가기
  const goBack = () => {
    router.back()
  }

  // 수정 페이지로 이동
  const goToEdit = async () => {
    try {
      // 기존 인증 정보 확인
      const authKey = `edit_auth_${postId}`
      const authData = process.client ? sessionStorage.getItem(authKey) : null
      
      let isAuthenticated = false
      
      if (authData) {
        try {
          const { timestamp } = JSON.parse(authData)
          const now = Date.now()
          const oneHour = 60 * 60 * 1000 // 1시간
          
          // 1시간 이내인지 확인
          if (now - timestamp < oneHour) {
            isAuthenticated = true
          } else {
            // 만료된 인증 정보 삭제
            sessionStorage.removeItem(authKey)
          }
        } catch (error) {
          console.error('인증 데이터 파싱 실패:', error)
          sessionStorage.removeItem(authKey)
        }
      }

      if (isAuthenticated) {
        // 인증된 경우 바로 수정 페이지로 이동
        // beforeunload 이벤트 일시적으로 제거하여 경고 방지
        const originalBeforeUnload = window.onbeforeunload
        window.onbeforeunload = null
        
        await navigateTo(`/post/${postId}/edit`)
        
        // 이동 후 원래 beforeunload 이벤트 복원 (필요한 경우)
        window.onbeforeunload = originalBeforeUnload
      } else {
        // 인증이 필요한 경우 비밀번호 확인 모달 표시
        showPasswordModal.value = true
      }
    } catch (error) {
      console.error('수정 페이지 이동 실패:', error)
      useToast().add({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요.',
        color: 'red',
      })
    }
  }

  // 비밀번호 확인 후 수정 페이지로 이동
  const handleEditPasswordConfirm = async (password: string) => {
    const isValid = await authenticateForEdit(password)
    
    if (isValid) {
      showPasswordModal.value = false
      
      // beforeunload 이벤트 일시적으로 제거하여 경고 방지
      const originalBeforeUnload = window.onbeforeunload
      window.onbeforeunload = null
      
      await navigateTo(`/post/${postId}/edit`)
      
      // 이동 후 원래 beforeunload 이벤트 복원 (필요한 경우)
      window.onbeforeunload = originalBeforeUnload
    } else {
      throw new Error('비밀번호가 일치하지 않습니다.')
    }
  }

  // 삭제 확인
  const showDeleteConfirmation = () => {
    showDeleteModal.value = true
  }

  // 삭제 실행
  const handleDelete = async (password: string) => {
    isDeleting.value = true
    
    try {
      const { deletePost } = usePost(postId)
      await deletePost(password)
      
      showDeleteModal.value = false
      
      // 홈으로 이동
      await navigateTo('/')
    } catch (error: any) {
      console.error('게시글 삭제 실패:', error)
      
      const errorMessage = error.statusMessage || error.data?.message || '게시글 삭제에 실패했습니다.'
      
      useToast().add({
        title: '삭제 실패',
        description: errorMessage,
        color: 'red',
      })
      
      throw error
    } finally {
      isDeleting.value = false
    }
  }

  // 삭제 취소
  const cancelDelete = () => {
    showDeleteModal.value = false
  }

  // 작성자 여부 확인 (비밀번호 기반)
  const checkIsAuthor = async (password: string): Promise<boolean> => {
    try {
      const { verifyPostPassword } = usePost(postId)
      return await verifyPostPassword(password)
    } catch (error) {
      console.error('작성자 확인 실패:', error)
      return false
    }
  }

  return {
    // 상태
    showDeleteModal,
    deletePasswordDialogRef,
    showPasswordModal,
    isDeleting,

    // 메서드
    goBack,
    goToEdit,
    handleEditPasswordConfirm,
    showDeleteConfirmation,
    handleDelete,
    cancelDelete,
    checkIsAuthor,
    authenticateForEdit,
  }
}