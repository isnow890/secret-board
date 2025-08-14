import { ref, readonly } from "vue";
import type { UploadingImage } from '~/types';
import { ImageCompressor } from '~/utils/imageCompression';

/**
 * @description Tiptap 에디터의 이미지 업로드 관련 로직을 처리하는 컴포저블입니다.
 * 파일 유효성 검사, 압축, 서버 전송, 진행 상태 관리를 담당합니다.
 */
export const useImageUpload = () => {
  /**
   * @description 현재 업로드 중인 이미지 파일들의 목록
   * @type {import('vue').Ref<UploadingImage[]>}
   */
  const uploadingImages = ref<UploadingImage[]>([]);
  
  /**
   * @description 현재 이미지 업로드가 진행 중인지 여부
   * @type {import('vue').Ref<boolean>}
   */
  const uploading = ref(false);

  /**
   * @description 업로드 목록에 새 파일을 추가하고 임시 ID를 반환합니다.
   * @param {string} filename - 원본 파일명
   * @returns {string} 생성된 임시 ID
   */
  const addUploadingFile = (filename: string): string => {
    const id = crypto.randomUUID();
    uploadingImages.value.push({
      id,
      name: filename,
      file: new File([], filename), // placeholder
      progress: 0,
      status: "uploading",
    });
    return id;
  };

  /**
   * @description 업로드 목록에서 특정 파일을 제거합니다.
   * @param {string} id - 제거할 파일의 임시 ID
   */
  const removeUploadingFile = (id: string) => {
    const index = uploadingImages.value.findIndex((u) => u.id === id);
    if (index !== -1) {
      uploadingImages.value.splice(index, 1);
    }
  };

  /**
   * @description 특정 파일의 업로드 진행률을 업데이트합니다.
   * @param {string} id - 업데이트할 파일의 임시 ID
   * @param {number} progress - 새로운 진행률 (0-100)
   */
  const updateUploadProgress = (id: string, progress: number) => {
    const upload = uploadingImages.value.find((u) => u.id === id);
    if (upload) {
      upload.progress = Math.round(progress);
    }
  };

  /**
   * @description 특정 파일의 업로드 상태를 변경합니다.
   * @param {string} id - 상태를 변경할 파일의 임시 ID
   * @param {"uploading" | "completed" | "error"} status - 새로운 상태
   */
  const setUploadStatus = (
    id: string,
    status: "uploading" | "completed" | "error"
  ) => {
    const upload = uploadingImages.value.find((u) => u.id === id);
    if (upload) {
      upload.status = status;
    }
  };

  /**
   * @description Blob 객체를 서버에 이미지로 업로드합니다. XMLHttpRequest를 사용하여 진행률을 추적합니다.
   * @param {Blob} file - 업로드할 파일 Blob
   * @param {(progress: number) => void} onProgress - 진행률 콜백 함수
   * @returns {Promise<string>} 업로드된 이미지의 URL
   * @throws {Error} 업로드 실패 시 에러 발생
   */
  const uploadImageToServer = async (
    file: Blob,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file, "image.jpg");

    try {
      const config = useRuntimeConfig();
      const clientApiKey = config.public?.serverApiKey;

      const response = await new Promise<{
        success: boolean;
        data: { url: string };
        error?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        const baseURL = config.app?.baseURL || '';
        const uploadUrl = baseURL.endsWith('/') ? `${baseURL}api/upload/image` : `${baseURL}/api/upload/image`;
        
        xhr.open('POST', uploadUrl);
        
        if (clientApiKey) {
          xhr.setRequestHeader('x-api-key', clientApiKey);
        }
        
        xhr.send(formData);
      });

      if (response.success && response.data?.url) {
        return response.data.url;
      } else {
        throw new Error(response.error || "업로드 실패");
      }
    } catch (error: any) {
      console.error("❌ 업로드 실패:", error);
      if (error.status === 404) {
        throw new Error(`업로드 실패 (404): API 경로를 찾을 수 없습니다.`);
      } else if (error.status) {
        throw new Error(`업로드 실패 (${error.status}): ${error.statusText || error.message}`);
      } else {
        throw new Error(error.message || "네트워크 오류");
      }
    }
  };

  /**
   * @description 이미지 파일 처리의 전체 워크플로우를 담당합니다. (유효성 검사, 압축, 업로드, 에디터 삽입)
   * @param {File} file - 사용자가 선택한 이미지 파일
   * @param {(url: string) => void} insertImageCallback - 업로드 완료 후 에디터에 이미지를 삽입하는 콜백 함수
   * @throws {Error} 처리 과정 중 실패 시 에러 발생
   */
  const processImageFile = async (
    file: File,
    insertImageCallback: (url: string) => void
  ): Promise<void> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드 가능합니다.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("파일 크기는 10MB 이하여야 합니다.");
    }

    const uploadId = addUploadingFile(file.name);

    try {
      updateUploadProgress(uploadId, 10);
      const compressedFile = await ImageCompressor.compress(file);
      updateUploadProgress(uploadId, 30);
      const url = await uploadImageToServer(compressedFile, (progress) => {
        updateUploadProgress(uploadId, 30 + progress * 0.7);
      });
      insertImageCallback(url);
      setUploadStatus(uploadId, "completed");
      updateUploadProgress(uploadId, 100);
      setTimeout(() => removeUploadingFile(uploadId), 1000);
    } catch (error) {
      setUploadStatus(uploadId, "error");
      setTimeout(() => removeUploadingFile(uploadId), 3000);
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      throw new Error(`이미지 업로드에 실패했습니다: ${errorMessage}`);
    }
  };

  return {
    /** 현재 업로드 중인 이미지 목록 (읽기 전용) */
    uploadingImages: readonly(uploadingImages),
    /** 이미지 업로드 진행 중 여부 (읽기 전용) */
    uploading: readonly(uploading),
    addUploadingFile,
    removeUploadingFile,
    updateUploadProgress,
    setUploadStatus,
    uploadImageToServer,
    processImageFile,
  };
};
