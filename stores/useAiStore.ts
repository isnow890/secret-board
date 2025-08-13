// stores/useAiStore.ts
export const useAiStore = defineStore('ai', () => {
  // 마지막 AI 요청 시간
  const lastReviseTime = ref<number | null>(null)
  
  // AI 요청 쿨다운 시간 (밀리초) - 20초
  const COOLDOWN_TIME = 20 * 1000
  
  /**
   * AI 말투 변경이 가능한지 확인
   */
  const canRevise = computed(() => {
    if (!lastReviseTime.value) return true
    
    const now = Date.now()
    const timeDiff = now - lastReviseTime.value
    
    return timeDiff >= COOLDOWN_TIME
  })
  
  /**
   * 다음 요청까지 남은 시간 (초)
   */
  const remainingCooldown = computed(() => {
    if (!lastReviseTime.value || canRevise.value) return 0
    
    const now = Date.now()
    const timeDiff = now - lastReviseTime.value
    const remaining = Math.ceil((COOLDOWN_TIME - timeDiff) / 1000)
    
    return Math.max(0, remaining)
  })
  
  /**
   * AI 요청 시작 시 호출
   */
  const markReviseStart = () => {
    lastReviseTime.value = Date.now()
  }
  
  /**
   * 쿨다운 리셋 (개발/테스트용)
   */
  const resetCooldown = () => {
    lastReviseTime.value = null
  }
  
  return {
    lastReviseTime: readonly(lastReviseTime),
    canRevise,
    remainingCooldown,
    markReviseStart,
    resetCooldown,
    COOLDOWN_TIME
  }
})