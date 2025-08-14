import { ref, computed, readonly, type Ref } from 'vue'
import type { CreatePostRequest } from '~/types'
import { validateNickname } from '~/utils/nicknameGenerator'

/**
 * @description 게시글 작성 및 수정 폼의 유효성 검사를 관리하는 컴포저블입니다.
 * @param {Ref<CreatePostRequest>} form - 유효성을 검사할 폼의 반응형 상태 객체
 */
export const usePostFormValidation = (form: Ref<CreatePostRequest>) => {
  /**
   * @description 각 필드별 유효성 검사 에러 메시지를 담는 객체
   * @type {import('vue').Ref<Partial<Record<keyof CreatePostRequest, string>>>}
   */
  const errors = ref<Partial<Record<keyof CreatePostRequest, string>>>({})

  /**
   * @description 폼 전체의 유효성 상태를 실시간으로 계산하는 속성
   * @returns {boolean} 모든 필드가 유효하면 true, 아니면 false
   */
  const isFormValid = computed(() => {
    const nicknameValidation = validateNickname(form.value.nickname)
    const titleValid = form.value.title.trim().length >= 3
    
    const textContent = form.value.content.replace(/<[^>]*>/g, '').trim()
    const contentValid = textContent.length >= 10
    
    const nicknameValid = nicknameValidation.isValid
    const passwordValid = form.value.password.length === 4 && /^[0-9]{4}$/.test(form.value.password)
    
    return titleValid && contentValid && nicknameValid && passwordValid
  })

  /**
   * @description 폼의 모든 필드에 대한 유효성 검사를 실행하고, `errors` 상태를 업데이트합니다.
   * @returns {boolean} 모든 필드가 유효하면 true, 아니면 false
   */
  const validateForm = (): boolean => {
    errors.value = {}

    const title = form.value.title.trim()
    const textContent = form.value.content.replace(/<[^>]*>/g, '').trim()
    const nickname = form.value.nickname.trim()
    const password = form.value.password

    if (title.length < 3) {
      errors.value.title = '제목은 3자 이상이어야 합니다.'
    } else if (title.length > 255) {
      errors.value.title = '제목은 255자 이하여야 합니다.'
    }

    if (textContent.length < 10) {
      errors.value.content = '내용은 10자 이상이어야 합니다.'
    } else if (textContent.length > 50000) {
      errors.value.content = '내용이 너무 깁니다. (최대 50,000자)'
    }

    const nicknameValidation = validateNickname(nickname)
    if (!nicknameValidation.isValid) {
      errors.value.nickname = nicknameValidation.error
    }

    if (password.length !== 4) {
      errors.value.password = '비밀번호는 4자리 숫자여야 합니다.'
    } else if (!/^[0-9]{4}$/.test(password)) {
      errors.value.password = '비밀번호는 숫자만 입력 가능합니다.'
    }

    return Object.keys(errors.value).length === 0
  }

  /**
   * @description 모든 유효성 검사 에러 메시지를 초기화합니다.
   */
  const clearErrors = () => {
    errors.value = {}
  }

  return {
    /** 유효성 검사 에러 객체 (읽기 전용) */
    errors: readonly(errors),
    /** 폼 전체 유효성 상태 */
    isFormValid,
    /** 유효성 검사 실행 함수 */
    validateForm,
    /** 에러 초기화 함수 */
    clearErrors,
  }
}