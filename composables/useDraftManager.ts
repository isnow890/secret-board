// composables/useDraftManager.ts
import { ref, computed } from 'vue'
import type { CreatePostRequest } from '~/types'

export const useDraftManager = (form: Ref<CreatePostRequest>) => {
  const hasSavedDraft = ref(false)
  const { add: addToast } = useToast()

  const canSaveDraft = computed(() => {
    const hasTitle = form.value.title.trim().length > 0
    const hasContent = form.value.content.trim().length > 0
    // 제목이나 내용 중 하나라도 의미있는 내용이 있어야 함
    return (
      (hasTitle && form.value.title.trim().length >= 2) ||
      (hasContent && form.value.content.trim().length >= 5)
    )
  })

  const checkDraftExists = () => {
    hasSavedDraft.value = localStorage.getItem('draft_post') !== null
  }

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem('draft_post')
      if (saved) {
        const draft = JSON.parse(saved)
        // 보안상 비밀번호는 임시저장하지 않음
        Object.assign(form.value, { ...draft, password: '' })

        // 임시저장 불러오기 알림
        addToast({
          title: '임시저장 불러옴',
          description: '이전에 작성하던 내용을 불러왔습니다.',
          variant: 'info',
          timeout: 3000,
        })
      }
    } catch (error) {
      console.error('임시저장 불러오기 실패:', error)

      addToast({
        title: '임시저장 불러오기 실패',
        description: '이전 내용을 불러오는데 실패했습니다.',
        variant: 'error',
        timeout: 4000,
      })
    }
  }

  const saveDraft = () => {
    if (!canSaveDraft.value) return

    try {
      // 비밀번호는 임시저장하지 않음
      const draftData = {
        title: form.value.title,
        content: form.value.content,
        nickname: form.value.nickname,
        attachedFiles: form.value.attachedFiles,
      }

      localStorage.setItem('draft_post', JSON.stringify(draftData))
      checkDraftExists() // 상태 업데이트

      // Toast로 성공 메시지 표시
      addToast({
        title: '임시저장 완료',
        description: '작성 중인 내용이 저장되었습니다.',
        variant: 'success',
        timeout: 3000,
      })
    } catch (error) {
      console.error('임시저장 실패:', error)

      // Toast로 에러 메시지 표시
      addToast({
        title: '임시저장 실패',
        description: '임시저장에 실패했습니다. 다시 시도해주세요.',
        variant: 'error',
        timeout: 5000,
      })
    }
  }

  const deleteDraft = () => {
    // 삭제 확인 다이얼로그
    const confirmed = confirm(
      '임시저장된 내용을 삭제하시겠습니까?\n\n삭제하면 현재 작성 중인 모든 내용이 초기화되며, 이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmed) {
      return // 사용자가 취소한 경우
    }

    try {
      if (localStorage.getItem('draft_post')) {
        localStorage.removeItem('draft_post')
        checkDraftExists() // 상태 업데이트

        return true // 삭제 성공
      } else {
        addToast({
          title: '삭제할 내용 없음',
          description: '임시저장된 내용이 없습니다.',
          variant: 'info',
          timeout: 2000,
        })
        return false
      }
    } catch (error) {
      console.error('임시저장 삭제 실패:', error)

      addToast({
        title: '삭제 실패',
        description: '임시저장 삭제 중 오류가 발생했습니다.',
        variant: 'error',
        timeout: 4000,
      })
      return false
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem('draft_post')
      checkDraftExists() // 상태 업데이트
    } catch (error) {
      console.error('임시저장 삭제 실패:', error)
    }
  }

  return {
    hasSavedDraft: readonly(hasSavedDraft),
    canSaveDraft,
    checkDraftExists,
    loadDraft,
    saveDraft,
    deleteDraft,
    clearDraft,
  }
}