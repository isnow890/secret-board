// types/domains/upload.ts

export interface AttachedFile {
  filename: string;
  url: string;
  size: number;
  type?: string;
}

export interface UploadedFile {
  filename: string;
  url: string;
  size: number;
}

export interface UploadingFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "completed" | "error";
  progress: number;
}

// 이미지 업로드용 확장 인터페이스
export interface UploadingImage {
  id: string;
  name: string;  // filename -> name으로 변경
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}