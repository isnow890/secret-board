// composables/usePostFormValidation.ts
import { ref, computed } from 'vue'
import type { CreatePostRequest } from '~/types'
import { validateNickname } from '~/utils/nicknameGenerator'

export const usePostFormValidation = (form: Ref<CreatePostRequest>) => {
  const errors = ref<Partial<Record<keyof CreatePostRequest, string>>>({})

  const isFormValid = computed(() => {
    const nicknameValidation = validateNickname(form.value.nickname)
    const titleValid = form.value.title.trim().length >= 3
    
    // HTML 태그 제거한 순수 텍스트로 길이 검증
    const textContent = form.value.content.replace(/<[^>]*>/g, '').trim()
    const contentValid = textContent.length >= 10
    
    const nicknameValid = nicknameValidation.isValid
    const passwordValid = form.value.password.length === 4 && /^[0-9]{4}$/.test(form.value.password)
    
    
    return titleValid && contentValid && nicknameValid && passwordValid
  })

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

    // 닉네임 검증
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

  const clearErrors = () => {
    errors.value = {}
  }

  return {
    errors: readonly(errors),
    isFormValid,
    validateForm,
    clearErrors,
  }
}