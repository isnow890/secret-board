import { ref, computed, readonly, type Ref } from 'vue'
import type { CreatePostRequest } from '~/types'

/**
 * @description 게시글 작성 폼의 임시저장 기능을 관리하는 컴포저블입니다.
 * 사용자가 작성 중인 내용을 브라우저의 localStorage에 저장하고, 불러오고, 삭제하는 기능을 제공합니다.
 * @param {Ref<CreatePostRequest>} form - 게시글 작성 폼의 반응형 상태 객체
 */
export const useDraftManager = (form: Ref<CreatePostRequest>) => {
  /**
   * @description 저장된 임시저장 데이터가 있는지 여부
   * @type {import('vue').Ref<boolean>}
   */
  const hasSavedDraft = ref(false)
  const { add: addToast } = useToast()

  /**
   * @description 현재 폼 내용이 임시저장 가능한 상태인지 계산하는 속성
   * 제목이나 내용이 일정 길이 이상이어야 true를 반환합니다.
   * @returns {boolean}
   */
  const canSaveDraft = computed(() => {
    const hasTitle = form.value.title.trim().length > 0
    const hasContent = form.value.content.trim().length > 0
    return (
      (hasTitle && form.value.title.trim().length >= 2) ||
      (hasContent && form.value.content.trim().length >= 5)
    )
  })

  /**
   * @description localStorage를 확인하여 임시저장된 데이터 존재 여부를 상태에 반영합니다.
   */
  const checkDraftExists = () => {
    hasSavedDraft.value = localStorage.getItem('draft_post') !== null
  }

  /**
   * @description 저장된 임시저장 내용을 폼으로 불러옵니다.
   * 보안을 위해 비밀번호는 불러오지 않습니다.
   */
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem('draft_post')
      if (saved) {
        const draft = JSON.parse(saved)
        Object.assign(form.value, { ...draft, password: '' })

        addToast({
          title: '임시저장 불러옴',
          description: '이전에 작성하던 내용을 불러왔습니다.',
          color: 'blue',
          timeout: 3000,
        })
      }
    } catch (error) {
      console.error('임시저장 불러오기 실패:', error)
      addToast({
        title: '임시저장 불러오기 실패',
        description: '이전 내용을 불러오는데 실패했습니다.',
        color: 'red',
        timeout: 4000,
      })
    }
  }

  /**
   * @description 현재 폼의 내용을 localStorage에 임시저장합니다.
   * 보안을 위해 비밀번호는 저장하지 않습니다.
   */
  const saveDraft = () => {
    if (!canSaveDraft.value) return

    try {
      const draftData = {
        title: form.value.title,
        content: form.value.content,
        nickname: form.value.nickname,
        attachedFiles: form.value.attachedFiles,
      }

      localStorage.setItem('draft_post', JSON.stringify(draftData))
      checkDraftExists()

      addToast({
        title: '임시저장 완료',
        description: '작성 중인 내용이 저장되었습니다.',
        color: 'green',
        timeout: 3000,
      })
    } catch (error) {
      console.error('임시저장 실패:', error)
      addToast({
        title: '임시저장 실패',
        description: '임시저장에 실패했습니다. 다시 시도해주세요.',
        color: 'red',
        timeout: 5000,
      })
    }
  }

  /**
   * @description 사용자 확인 후 저장된 임시저장 내용을 삭제하고 폼을 초기화합니다.
   * @returns {boolean | undefined} 삭제 성공 시 true, 사용자가 취소하면 undefined
   */
  const deleteDraft = () => {
    const confirmed = confirm(
      '임시저장된 내용을 삭제하시겠습니까?\n\n삭제하면 현재 작성 중인 모든 내용이 초기화되며, 이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmed) {
      return
    }

    try {
      if (localStorage.getItem('draft_post')) {
        localStorage.removeItem('draft_post')
        checkDraftExists()
        return true
      } else {
        addToast({
          title: '삭제할 내용 없음',
          description: '임시저장된 내용이 없습니다.',
          color: 'blue',
          timeout: 2000,
        })
        return false
      }
    } catch (error) {
      console.error('임시저장 삭제 실패:', error)
      addToast({
        title: '삭제 실패',
        description: '임시저장 삭제 중 오류가 발생했습니다.',
        color: 'red',
        timeout: 4000,
      })
      return false
    }
  }

  /**
   * @description 사용자 확인 없이 임시저장된 내용을 조용히 삭제합니다.
   * 주로 게시글 작성 완료 후 호출됩니다.
   */
  const clearDraft = () => {
    try {
      localStorage.removeItem('draft_post')
      checkDraftExists()
    } catch (error) {
      console.error('임시저장 삭제 실패:', error)
    }
  }

  return {
    /** 저장된 임시저장 데이터 존재 여부 (읽기 전용) */
    hasSavedDraft: readonly(hasSavedDraft),
    /** 현재 내용 저장 가능 여부 */
    canSaveDraft,
    /** 임시저장 존재 여부 확인 */
    checkDraftExists,
    /** 임시저장 불러오기 */
    loadDraft,
    /** 임시저장하기 */
    saveDraft,
    /** 사용자 확인 후 임시저장 삭제 */
    deleteDraft,
    /** 임시저장 조용히 삭제 */
    clearDraft,
  }
}
