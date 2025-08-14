import { ref, readonly } from 'vue'

/**
 * @description 게시글 상세 페이지에서의 사용자 액션(수정, 삭제, 뒤로가기 등)을 관리하는 컴포저블입니다.
 * 비밀번호 인증, 모달 관리, 페이지 이동 로직을 포함합니다.
 * @param {string} postId - 현재 게시글의 ID
 */
export const usePostActions = (postId: string) => {
  const router = useRouter()
  
  /**
   * @description 삭제 확인 모달의 표시 여부
   * @type {import('vue').Ref<boolean>}
   */
  const showDeleteModal = ref(false)
  
  /**
   * @description 비밀번호 확인 다이얼로그 컴포넌트의 참조
   */
  const deletePasswordDialogRef = ref()
  
  /**
   * @description 수정용 비밀번호 확인 모달의 표시 여부
   * @type {import('vue').Ref<boolean>}
   */
  const showPasswordModal = ref(false)
  
  /**
   * @description 현재 삭제가 진행 중인지 여부
   * @type {import('vue').Ref<boolean>}
   */
  const isDeleting = ref(false)

  /**
   * @description 게시글 수정을 위해 비밀번호를 인증하고, 성공 시 세션 스토리지에 인증 정보를 저장합니다.
   * @param {string} password - 사용자가 입력한 비밀번호
   * @returns {Promise<boolean>} 인증 성공 여부
   */
  const authenticateForEdit = async (password: string): Promise<boolean> => {
    try {
      const { verifyPostPassword } = usePost(postId)
      const isValid = await verifyPostPassword(password)

      if (isValid && process.client) {
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

  /**
   * @description 브라우저의 이전 페이지로 이동합니다.
   */
  const goBack = () => {
    router.back()
  }

  /**
   * @description 게시글 수정 페이지로 이동합니다. 세션 스토리지에 유효한 인증 정보가 있으면 바로 이동하고, 없으면 비밀번호 확인 모달을 띄웁니다.
   */
  const goToEdit = async () => {
    try {
      const authKey = `edit_auth_${postId}`
      const authData = process.client ? sessionStorage.getItem(authKey) : null
      
      let isAuthenticated = false
      
      if (authData) {
        try {
          const { timestamp } = JSON.parse(authData)
          const now = Date.now()
          const oneHour = 60 * 60 * 1000
          
          if (now - timestamp < oneHour) {
            isAuthenticated = true
          } else {
            sessionStorage.removeItem(authKey)
          }
        } catch (error) {
          console.error('인증 데이터 파싱 실패:', error)
          sessionStorage.removeItem(authKey)
        }
      }

      if (isAuthenticated) {
        const originalBeforeUnload = window.onbeforeunload
        window.onbeforeunload = null
        await navigateTo(`/post/${postId}/edit`)
        window.onbeforeunload = originalBeforeUnload
      } else {
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

  /**
   * @description 비밀번호 확인 모달에서 확인 버튼을 눌렀을 때 실행됩니다. 비밀번호 인증 후 수정 페이지로 이동합니다.
   * @param {string} password - 사용자가 입력한 비밀번호
   * @throws {Error} 비밀번호가 일치하지 않을 경우 에러 발생
   */
  const handleEditPasswordConfirm = async (password: string) => {
    const isValid = await authenticateForEdit(password)
    
    if (isValid) {
      showPasswordModal.value = false
      const originalBeforeUnload = window.onbeforeunload
      window.onbeforeunload = null
      await navigateTo(`/post/${postId}/edit`)
      window.onbeforeunload = originalBeforeUnload
    } else {
      throw new Error('비밀번호가 일치하지 않습니다.')
    }
  }

  /**
   * @description 게시글 삭제 확인 모달을 표시합니다.
   */
  const showDeleteConfirmation = () => {
    showDeleteModal.value = true
  }

  /**
   * @description 비밀번호를 확인하고 게시글 삭제를 실행합니다.
   * @param {string} password - 사용자가 입력한 비밀번호
   * @throws {Error} 삭제 실패 시 에러 발생
   */
  const handleDelete = async (password: string) => {
    isDeleting.value = true
    
    try {
      const { deletePost } = usePost(postId)
      await deletePost(password)
      
      showDeleteModal.value = false
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

  /**
   * @description 게시글 삭제를 취소하고 모달을 닫습니다.
   */
  const cancelDelete = () => {
    showDeleteModal.value = false
  }

  /**
   * @description 비밀번호 확인 모달을 취소하고 닫습니다.
   */
  const cancelPasswordModal = () => {
    showPasswordModal.value = false
  }

  /**
   * @description 입력된 비밀번호가 게시글 작성자의 비밀번호와 일치하는지 확인합니다.
   * @param {string} password - 확인할 비밀번호
   * @returns {Promise<boolean>} 일치 여부
   */
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
    /** 삭제 확인 모달 표시 상태 */
    showDeleteModal: readonly(showDeleteModal),
    /** 비밀번호 확인 다이얼로그 참조 */
    deletePasswordDialogRef,
    /** 수정용 비밀번호 모달 표시 상태 */
    showPasswordModal: readonly(showPasswordModal),
    /** 삭제 처리 중 상태 */
    isDeleting: readonly(isDeleting),
    goBack,
    goToEdit,
    handleEditPasswordConfirm,
    showDeleteConfirmation,
    handleDelete,
    cancelDelete,
    cancelPasswordModal,
    checkIsAuthor,
    authenticateForEdit,
  }
}