// utils/imageCompression.ts
export class ImageCompressor {
  private static readonly MAX_WIDTH = 1920
  private static readonly MAX_HEIGHT = 1080
  private static readonly QUALITY = 0.8
  private static readonly TARGET_SIZE = 500 * 1024 // 500KB

  static async compress(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        reject(new Error('이미지 파일만 압축 가능합니다.'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        try {
          // 원본 크기 확인
          let { width, height } = img
          
          // 리사이징 필요한지 확인
          if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
            const ratio = Math.min(this.MAX_WIDTH / width, this.MAX_HEIGHT / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          canvas.width = width
          canvas.height = height

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height)

          // WebP 지원 확인
          const format = this.supportsWebP() ? 'image/webp' : 'image/jpeg'
          const quality = format === 'image/webp' ? 0.85 : this.QUALITY
          
          canvas.toBlob((blob) => {
            if (blob) {
              // 목표 크기보다 크면 품질 조정
              if (blob.size > this.TARGET_SIZE && format === 'image/jpeg') {
                this.adjustQuality(canvas, Math.max(0.3, this.QUALITY - 0.2), resolve)
              } else {
                resolve(blob)
              }
            } else {
              reject(new Error('이미지 압축에 실패했습니다.'))
            }
          }, format, quality)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('이미지 로드에 실패했습니다.'))
      }

      // 이미지 로드
      img.src = URL.createObjectURL(file)
    })
  }

  private static adjustQuality(canvas: HTMLCanvasElement, quality: number, resolve: (blob: Blob) => void): void {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      }
    }, 'image/jpeg', quality)
  }

  private static supportsWebP(): boolean {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      return canvas.toDataURL('image/webp').startsWith('data:image/webp')
    } catch {
      return false
    }
  }

  // 파일 크기 포맷팅 유틸리티
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 이미지 미리보기 생성
  static createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('이미지 파일이 아닙니다.'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.onerror = () => {
        reject(new Error('파일 읽기에 실패했습니다.'))
      }
      reader.readAsDataURL(file)
    })
  }
}