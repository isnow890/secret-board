/**
 * @description 파일 업로드 공통 유틸리티
 * 기존 코드와 병행 실행을 위해 새로 생성된 유틸리티입니다.
 */
import type { Database } from "~/types/supabase";

/**
 * 파일 업로드 결과 인터페이스
 */
export interface FileUploadResult {
  filename: string;
  url: string;
  size: number;
  path: string;
  type?: string;
}

/**
 * 파일 업로드 옵션
 */
export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  bucket: string;
  generateCustomFilename?: boolean;
}

/**
 * 안전한 파일명 생성
 * @param originalFilename 원본 파일명
 * @param prefix 접두사 (예: 'image', 'file')
 * @returns 안전한 파일명
 */
export function generateSafeFilename(originalFilename?: string, prefix: string = 'file'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  let extension = 'bin';
  if (originalFilename) {
    const parts = originalFilename.split('.');
    if (parts.length > 1) {
      extension = parts.pop()!.toLowerCase();
    }
  }
  
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * 파일 경로 생성 (년/월/일 구조)
 * @param filename 파일명
 * @returns 년/월/일/파일명 경로
 */
export function generateFilePath(filename: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}/${filename}`;
}

/**
 * 이미지 파일 확장자 정규화
 * @param filename 파일명
 * @param mimeType MIME 타입
 * @returns 정규화된 확장자
 */
export function normalizeImageExtension(filename?: string, mimeType?: string): string {
  // 파일명에서 확장자 추출
  if (filename) {
    const fileExt = filename.split('.').pop()?.toLowerCase();
    if (fileExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      return fileExt === 'jpeg' ? 'jpg' : fileExt;
    }
  }
  
  // MIME 타입에서 확장자 추출
  if (mimeType) {
    const typeExt = mimeType.split('/')[1];
    if (typeExt && ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(typeExt)) {
      return typeExt === 'jpeg' ? 'jpg' : typeExt;
    }
  }
  
  return 'jpg'; // 기본값
}

/**
 * 파일 검증
 * @param file 업로드된 파일
 * @param options 업로드 옵션
 * @throws createError 검증 실패시 에러
 */
export function validateFile(file: any, options: FileUploadOptions): void {
  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: '파일이 없습니다.',
    });
  }

  // 크기 검증
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 기본 10MB
  if (!file.data || file.data.length > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    throw createError({
      statusCode: 400,
      statusMessage: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`,
    });
  }

  // 타입 검증
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!file.type || !options.allowedTypes.includes(file.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: `지원하지 않는 파일 형식입니다. (받은 타입: ${file.type})`,
      });
    }
  }
}

/**
 * Supabase Storage에 파일 업로드
 * @param supabase Supabase 클라이언트
 * @param file 업로드할 파일
 * @param options 업로드 옵션
 * @returns 업로드 결과
 */
export async function uploadFileToStorage(
  supabase: any,
  file: any,
  options: FileUploadOptions
): Promise<FileUploadResult> {
  // 파일 검증
  validateFile(file, options);

  // 파일명 생성
  const prefix = options.bucket === 'post-images' ? 'image' : 'file';
  const filename = options.generateCustomFilename !== false 
    ? generateSafeFilename(file.filename, prefix)
    : file.filename;
  
  const filePath = generateFilePath(filename);

  // Supabase Storage에 업로드
  const { error } = await supabase.storage
    .from(options.bucket)
    .upload(filePath, file.data, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '파일 업로드에 실패했습니다: ' + error.message,
    });
  }

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from(options.bucket)
    .getPublicUrl(filePath);

  return {
    filename: file.filename || filename,
    url: urlData.publicUrl,
    size: file.data?.length || 0,
    path: filePath,
    type: file.type,
  };
}

/**
 * 이미지 업로드 (특화 함수)
 * @param supabase Supabase 클라이언트
 * @param file 이미지 파일
 * @returns 업로드 결과
 */
export async function uploadImage(
  supabase: any,
  file: any
): Promise<FileUploadResult> {
  return uploadFileToStorage(supabase, file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    bucket: 'post-images',
  });
}

/**
 * 일반 파일 업로드 (특화 함수)
 * @param supabase Supabase 클라이언트
 * @param file 파일
 * @returns 업로드 결과
 */
export async function uploadFile(
  supabase: any,
  file: any
): Promise<FileUploadResult> {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  return uploadFileToStorage(supabase, file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes,
    bucket: 'post-files',
  });
}

/**
 * 파일 삭제
 * @param supabase Supabase 클라이언트
 * @param bucket 버킷명
 * @param paths 삭제할 파일 경로들
 * @returns 삭제 결과
 */
export async function deleteFiles(
  supabase: any,
  bucket: string,
  paths: string[]
): Promise<{ deletedCount: number; errors: any[] }> {
  if (!paths || paths.length === 0) {
    return { deletedCount: 0, errors: [] };
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error('File deletion error:', error);
    return { deletedCount: 0, errors: [error] };
  }

  return { deletedCount: paths.length, errors: [] };
}

/**
 * HTML에서 이미지 경로 추출
 * @param html HTML 문자열
 * @returns 이미지 경로 배열
 */
export function extractImagePathsFromHtml(html: string): string[] {
  if (!html) return [];
  
  const regex = /\/storage\/v1\/object\/public\/post-images\/([^"'\s)]+)/g;
  const paths: string[] = [];
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      paths.push(match[1]);
    }
  }
  
  return paths;
}

/**
 * 첨부파일에서 파일 경로 추출
 * @param attachedFiles 첨부파일 배열
 * @param bucket 대상 버킷
 * @returns 파일 경로 배열
 */
export function extractFilePathsFromAttachments(
  attachedFiles: any[],
  bucket: string = 'attachments'
): string[] {
  if (!attachedFiles || attachedFiles.length === 0) return [];
  
  const paths: string[] = [];
  
  for (const file of attachedFiles) {
    try {
      const urlParts = file.url.split(`/storage/v1/object/public/${bucket}/`);
      if (urlParts.length > 1) {
        paths.push(urlParts[1]);
      }
    } catch (error) {
      console.error('Error extracting file path:', error);
    }
  }
  
  return paths;
}