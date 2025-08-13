/**
 * 사용자 인증 상태를 관리하는 Pinia 스토어
 * 
 * 기능:
 * - 사이트 접근을 위한 간단한 비밀번호 인증
 * - localStorage를 통한 인증 상태 지속
 * - 비밀번호 변경 감지 및 자동 로그아웃
 * 
 * 주의: 이는 완전한 보안 솔루션이 아니며, 간단한 접근 제어만 제공
 */

import { defineStore } from 'pinia'

// localStorage에서 인증 정보를 저장할 키
const AUTH_KEY = "board_auth";

export const useAuthStore = defineStore('auth', () => {
  // === 상태 관리 ===
  
  /** 사용자 인증 여부 */
  const isAuthenticated = ref(false)
  
  /** 로그인 처리 중 상태 */
  const loading = ref(false)
  
  /** 인증 관련 에러 메시지 */
  const error = ref('')
  
  /** 인증 상태 초기화 완료 여부 */
  const isInitialized = ref(false)

  // === 액션 메서드 ===
  
  /**
   * localStorage에서 인증 상태를 확인
   * @returns 인증 여부
   */
  const checkAuth = () => {
    // 서버사이드에서는 인증 체크 불가
    if (process.server) return false

    try {
      const storedPassword = localStorage.getItem(AUTH_KEY)
      const sitePassword = useRuntimeConfig().public.sitePassword

      const isValid = storedPassword === sitePassword
      isAuthenticated.value = isValid
      isInitialized.value = true
      return isValid
    } catch (err) {
      console.error("인증 상태 확인 실패:", err)
      isAuthenticated.value = false
      isInitialized.value = true
      return false
    }
  }

  /**
   * 비밀번호 변경 감지 및 처리
   * 관리자가 비밀번호를 변경했을 경우 자동으로 로그아웃
   * @returns 현재 인증 상태
   */
  const checkPasswordChange = () => {
    if (process.server) return true

    const storedPassword = localStorage.getItem(AUTH_KEY)
    const sitePassword = useRuntimeConfig().public.sitePassword

    // 저장된 비밀번호와 현재 사이트 비밀번호가 다르면 로그아웃
    if (storedPassword && storedPassword !== sitePassword) {
      clearAuth()
      return false
    }

    return checkAuth()
  }

  /**
   * 사용자 로그인 처리
   * @param password 입력된 비밀번호
   * @returns 로그인 성공 여부
   */
  const login = async (password: string) => {
    loading.value = true
    error.value = ""

    try {
      const sitePassword = useRuntimeConfig().public.sitePassword

      if (password === sitePassword) {
        // 비밀번호가 일치하면 localStorage에 저장
        localStorage.setItem(AUTH_KEY, password)
        isAuthenticated.value = true
        return true
      } else {
        error.value = "비밀번호가 올바르지 않습니다."
        return false
      }
    } catch (err: any) {
      console.error("로그인 실패:", err)
      error.value = "로그인 처리 중 오류가 발생했습니다."
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 인증 정보 완전 삭제
   */
  const clearAuth = () => {
    localStorage.removeItem(AUTH_KEY)
    isAuthenticated.value = false
  }

  /**
   * 사용자 로그아웃 처리
   */
  const logout = () => {
    clearAuth()
  }

  return {
    // 상태
    isAuthenticated,
    loading,
    error,
    isInitialized,

    // 메서드
    login,
    logout,
    checkAuth,
    checkPasswordChange,
    clearAuth,
  }
})