import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';

/**
 * @description AI 기능 관련 상태 및 쿨다운을 관리하는 Pinia 스토어
 */
export const useAiStore = defineStore('ai', () => {
  /**
   * @description 마지막으로 AI 글쓰기 수정 기능을 사용한 시간 (Unix 타임스탬프)
   * @type {import('vue').Ref<number | null>}
   */
  const lastReviseTime = ref<number | null>(null)
  
  /**
   * @description AI 기능 재사용을 위한 쿨다운 시간 (밀리초)
   * @constant
   * @type {number}
   */
  const COOLDOWN_TIME = 20 * 1000 // 20초
  
  /**
   * @description 현재 AI 말투 변경 기능 사용 가능 여부를 계산하는 계산된 속성
   * @returns {boolean} 쿨다운이 지나 사용 가능하면 true, 아니면 false
   */
  const canRevise = computed(() => {
    if (!lastReviseTime.value) return true
    const now = Date.now()
    const timeDiff = now - lastReviseTime.value
    return timeDiff >= COOLDOWN_TIME
  })
  
  /**
   * @description 다음 AI 기능 사용까지 남은 쿨다운 시간 (초 단위)을 계산하는 계산된 속성
   * @returns {number} 남은 시간(초), 쿨다운이 없으면 0
   */
  const remainingCooldown = computed(() => {
    if (!lastReviseTime.value || canRevise.value) return 0
    const now = Date.now()
    const timeDiff = now - lastReviseTime.value
    const remaining = Math.ceil((COOLDOWN_TIME - timeDiff) / 1000)
    return Math.max(0, remaining)
  })
  
  /**
   * @description AI 말투 변경 기능 사용 시 호출하여 마지막 사용 시간을 기록하는 액션
   */
  const markReviseStart = () => {
    lastReviseTime.value = Date.now()
  }
  
  /**
   * @description 쿨다운 상태를 초기화하는 액션 (주로 개발 및 테스트용)
   */
  const resetCooldown = () => {
    lastReviseTime.value = null
  }
  
  return {
    /** 마지막 AI 수정 요청 시간 (읽기 전용) */
    lastReviseTime: readonly(lastReviseTime),
    /** AI 수정 기능 사용 가능 여부 */
    canRevise,
    /** 다음 요청까지 남은 시간 (초) */
    remainingCooldown,
    /** AI 요청 시작 시간 기록 */
    markReviseStart,
    /** 쿨다운 리셋 */
    resetCooldown,
    /** 쿨다운 시간 (ms) */
    COOLDOWN_TIME
  }
})