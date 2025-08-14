/**
 * @description 애플리케이션 전반에서 사용되는 다양한 유틸리티 함수를 제공하는 컴포저블입니다.
 */
export const useUtils = () => {
  /**
   * @description 숫자를 축약된 형태(K, M)로 포맷팅합니다.
   * @param {number} num - 포맷팅할 숫자
   * @returns {string} 포맷팅된 문자열
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  /**
   * @description 날짜 문자열을 상대 시간(e.g., '5분 전')으로 변환합니다.
   * @param {string} dateString - ISO 형식의 날짜 문자열
   * @returns {string} 변환된 상대 시간 문자열
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInDays < 7) return `${diffInDays}일 전`
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  /**
   * @description 날짜 문자열을 절대적인 날짜 및 시간(e.g., '2023년 10월 27일 오후 3:45')으로 변환합니다.
   * @param {string} dateString - ISO 형식의 날짜 문자열
   * @returns {string} 변환된 날짜 및 시간 문자열
   */
  const formatAbsoluteDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  /**
   * @description `formatDate` 함수의 별칭입니다.
   * @param {string} dateString - ISO 형식의 날짜 문자열
   * @returns {string} 변환된 상대 시간 문자열
   */
  const formatTimeAgo = (dateString: string): string => formatDate(dateString)

  /**
   * @description 파일 크기(bytes)를 사람이 읽기 쉬운 형태(KB, MB, GB)로 변환합니다.
   * @param {number} bytes - 파일 크기 (바이트 단위)
   * @returns {string} 변환된 파일 크기 문자열
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * @description 텍스트를 지정된 최대 길이로 자르고 말줄임표(...)를 추가합니다.
   * @param {string} text - 원본 텍스트
   * @param {number} maxLength - 최대 길이
   * @returns {string} 잘린 텍스트
   */
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  /**
   * @description HTML 문자열에서 모든 태그를 제거하고 순수 텍스트만 추출합니다.
   * @param {string} html - HTML 문자열
   * @returns {string} 순수 텍스트
   */
  const stripHtml = (html: string): string => {
    if (process.server) {
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    }
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  /**
   * @description 텍스트 내에서 검색어를 찾아 `<mark>` 태그로 감싸 하이라이트 처리합니다.
   * @param {string} text - 원본 텍스트
   * @param {string} searchTerm - 하이라이트할 검색어
   * @returns {string} 하이라이트 처리된 HTML 문자열
   */
  const highlightSearch = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  /**
   * @description 주어진 문자열이 유효한 URL 형식인지 확인합니다.
   * @param {string} str - 검사할 문자열
   * @returns {boolean} URL 유효성 여부
   */
  const isValidUrl = (str: string): boolean => {
    try {
      new URL(str)
      return true
    } catch (_) {
      return false
    }
  }

  /**
   * @description 주어진 문자열이 유효한 이메일 형식인지 확인합니다.
   * @param {string} email - 검사할 이메일 문자열
   * @returns {boolean} 이메일 유효성 여부
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * @description 비밀번호의 강도를 평가하고 점수와 피드백을 반환합니다.
   * @param {string} password - 검사할 비밀번호
   * @returns {{score: number, feedback: string[]}} 평가 점수(0-5)와 피드백 메시지 배열
   */
  const checkPasswordStrength = (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = []
    let score = 0
    if (password.length >= 8) score += 1; else feedback.push('8자 이상이어야 합니다')
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; else feedback.push('특수문자를 포함해주세요')
    return { score, feedback }
  }

  /**
   * @description 주어진 텍스트를 클립보드에 복사합니다.
   * @param {string} text - 복사할 텍스트
   * @returns {Promise<boolean>} 복사 성공 여부
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        return success
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      return false
    }
  }

  /**
   * @description 지정된 시간 동안 호출되지 않으면 함수를 실행하는 디바운스 함수를 생성합니다.
   * @template T - 디바운스할 함수 타입
   * @param {T} func - 디바운스할 함수
   * @param {number} wait - 대기 시간 (밀리초)
   * @returns {((...args: Parameters<T>) => void)} 디바운스된 함수
   */
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  /**
   * @description 지정된 시간 간격으로 함수가 최대 한 번만 호출되도록 하는 스로틀 함수를 생성합니다.
   * @template T - 스로틀링할 함수 타입
   * @param {T} func - 스로틀링할 함수
   * @param {number} limit - 호출 간격 (밀리초)
   * @returns {((...args: Parameters<T>) => void)} 스로틀링된 함수
   */
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  return {
    formatNumber,
    formatDate,
    formatTimeAgo,
    formatAbsoluteDate,
    formatFileSize,
    truncateText,
    stripHtml,
    highlightSearch,
    isValidUrl,
    validateEmail,
    isValidEmail: validateEmail, // 별칭 추가
    checkPasswordStrength,
    copyToClipboard,
    debounce,
    throttle
  }
}