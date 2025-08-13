// composables/useUtils.ts
export const useUtils = () => {
  // 숫자 포맷팅 (1000 -> 1K)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // 날짜 포맷팅 (상대시간)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInMinutes < 1) {
      return '방금 전'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // 절대 날짜 포맷팅
  const formatAbsoluteDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 시간 전 포맷팅 (formatDate와 동일하지만 별칭으로 제공)
  const formatTimeAgo = (dateString: string): string => {
    return formatDate(dateString)
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 텍스트 자르기 (말줄임표 추가)
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // HTML에서 순수 텍스트 추출
  const stripHtml = (html: string): string => {
    if (process.server) {
      // 서버 사이드에서는 간단한 정규식 사용
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    }
    
    // 클라이언트 사이드에서는 DOM 파서 사용
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // 검색어 하이라이트
  const highlightSearch = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  // URL 유효성 검사
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return false
    }
  }

  // 이메일 유효성 검사
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 비밀번호 강도 체크
  const checkPasswordStrength = (password: string): {
    score: number
    feedback: string[]
  } => {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('8자 이상이어야 합니다')
    }

    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('특수문자를 포함해주세요')
    }

    return { score, feedback }
  }

  // 클립보드 복사
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // 폴백: 임시 textarea 사용
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

  // 디바운스 함수
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

  // 스로틀 함수
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
    isValidEmail,
    checkPasswordStrength,
    copyToClipboard,
    debounce,
    throttle
  }
}