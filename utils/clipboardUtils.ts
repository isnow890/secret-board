// utils/clipboardUtils.ts
export class ClipboardHandler {
  /**
   * 클립보드 붙여넣기 이벤트 리스너 설정
   */
  static setupPasteListener(
    editorElement: HTMLElement, 
    onImagePaste: (file: File) => Promise<void>,
    onTextPaste?: (text: string) => void
  ): () => void {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      let hasImage = false
      let textContent = ''

      // 클립보드 아이템 순회
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          hasImage = true
          const file = item.getAsFile()
          if (file) {
            try {
              event.preventDefault()
              await onImagePaste(file)
            } catch (error) {
              console.error('이미지 붙여넣기 실패:', error)
            }
          }
        } else if (item.type === 'text/plain') {
          item.getAsString((text) => {
            textContent = text
            if (onTextPaste && !hasImage) {
              onTextPaste(textContent)
            }
          })
        }
      }
    }

    // 이벤트 리스너 등록
    editorElement.addEventListener('paste', handlePaste)
    
    // 클린업 함수 반환
    return () => {
      editorElement.removeEventListener('paste', handlePaste)
    }
  }

  /**
   * 클립보드에서 이미지 파일 추출
   */
  static async extractImageFromClipboard(clipboardData: DataTransfer): Promise<File | null> {
    const items = clipboardData.items
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          return file
        }
      }
    }
    
    return null
  }

  /**
   * 드래그앤드롭 이미지 파일 추출
   */
  static extractImageFromDrop(dataTransfer: DataTransfer): File[] {
    const imageFiles: File[] = []
    const files = dataTransfer.files
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file && file.type.startsWith('image/')) {
        imageFiles.push(file)
      }
    }
    
    return imageFiles
  }

  /**
   * 클립보드에 텍스트 복사
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const result = document.execCommand('copy')
        textArea.remove()
        return result
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      return false
    }
  }

  /**
   * 스크린샷 감지 (파일명 패턴 기반)
   */
  static isScreenshot(file: File): boolean {
    const screenshotPatterns = [
      /screenshot/i,
      /screen shot/i,
      /스크린샷/i,
      /화면 캡처/i,
      /캡처/i
    ]
    
    return screenshotPatterns.some(pattern => pattern.test(file.name))
  }

  /**
   * 이미지 파일 검증
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 가능)'
      }
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: '이미지 크기가 너무 큽니다. (최대 10MB)'
      }
    }
    
    return { isValid: true }
  }
}