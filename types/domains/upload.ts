// types/domains/upload.ts

/**
 * @description 게시물에 첨부된 파일의 정보를 나타내는 인터페이스
 */
export interface AttachedFile {
  /** 파일명 */
  filename: string;
  /** 파일 접근 URL */
  url: string;
  /** 파일 크기 (bytes) */
  size: number;
  /** 파일 MIME 타입 */
  type?: string;
}

/**
 * @description 파일 업로드 API 성공 시 반환되는 데이터 인터페이스
 */
export interface UploadedFile {
  /** 저장된 파일명 */
  filename: string;
  /** 파일 접근 URL */
  url: string;
  /** 파일 크기 (bytes) */
  size: number;
}

/**
 * @description 파일 업로드 진행 상태를 나타내는 인터페이스 (일반 파일용)
 */
export interface UploadingFile {
  /** 임시 고유 ID */
  id: string;
  /** 원본 파일명 */
  name: string;
  /** 파일 크기 (bytes) */
  size: number;
  /** 업로드 상태 */
  status: "uploading" | "completed" | "error";
  /** 업로드 진행률 (0-100) */
  progress: number;
}

/**
 * @description Tiptap 에디터 내 이미지 업로드 진행 상태를 나타내는 인터페이스
 */
export interface UploadingImage {
  /** 임시 고유 ID */
  id: string;
  /** 원본 파일명 */
  name: string;
  /** 실제 File 객체 */
  file: File;
  /** 업로드 진행률 (0-100) */
  progress: number;
  /** 업로드 상태 */
  status: 'uploading' | 'completed' | 'error';
  /** 업로드 완료 후 URL */
  url?: string;
  /** 에러 발생 시 메시지 */
  error?: string;
}