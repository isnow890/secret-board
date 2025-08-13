// composables/editor/useImageUpload.ts
import { ref } from "vue";

import type { UploadingImage } from '~/types'

export const useImageUpload = () => {
  const uploadingImages = ref<UploadingImage[]>([]);
  const uploading = ref(false);

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

  const removeUploadingFile = (id: string) => {
    const index = uploadingImages.value.findIndex((u) => u.id === id);
    if (index !== -1) {
      uploadingImages.value.splice(index, 1);
    }
  };

  const updateUploadProgress = (id: string, progress: number) => {
    const upload = uploadingImages.value.find((u) => u.id === id);
    if (upload) {
      upload.progress = Math.round(progress);
    }
  };

  const setUploadStatus = (
    id: string,
    status: "uploading" | "completed" | "error"
  ) => {
    const upload = uploadingImages.value.find((u) => u.id === id);
    if (upload) {
      upload.status = status;
    }
  };

  const uploadImageToServer = async (
    file: Blob,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file, "image.jpg");

    try {
      const config = useRuntimeConfig();
      const clientApiKey = config.public?.serverApiKey;
      console.log("🔑 API Key 설정:", clientApiKey ? "있음" : "없음");

      // Use XMLHttpRequest for upload progress support
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

        // Account for baseURL in request
        const baseURL = config.app?.baseURL || '';
        const uploadUrl = baseURL.endsWith('/') ? `${baseURL}api/upload/image` : `${baseURL}/api/upload/image`;
        
        xhr.open('POST', uploadUrl);
        
        if (clientApiKey) {
          xhr.setRequestHeader('x-api-key', clientApiKey);
        }
        
        xhr.send(formData);
      });

      console.log("📡 서버 응답:", response);

      if (response.success && response.data?.url) {
        return response.data.url;
      } else {
        throw new Error(response.error || "업로드 실패");
      }
    } catch (error: any) {
      console.error("❌ 업로드 실패:", error);

      if (error.status === 404) {
        throw new Error(`업로드 실패 (404): Page not found: /api/upload/image`);
      } else if (error.status) {
        throw new Error(
          `업로드 실패 (${error.status}): ${error.statusText || error.message}`
        );
      } else {
        throw new Error(error.message || "네트워크 오류");
      }
    }
  };

  const processImageFile = async (
    file: File,
    insertImageCallback: (url: string) => void
  ): Promise<void> => {
    // 파일 검증
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드 가능합니다.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("파일 크기는 10MB 이하여야 합니다.");
    }

    console.log("🖼️ 이미지 업로드 시작:", file.name, file.type, file.size);

    // 업로딩 상태 추가
    const uploadId = addUploadingFile(file.name);
    console.log("📊 업로드 상태 추가됨:", uploadId);

    try {
      // 파일 검증 통과
      console.log("✅ 파일 검증 통과");
      updateUploadProgress(uploadId, 10);

      // 이미지 압축
      console.log("🗜️ 이미지 압축 시작...");
      const compressedFile = await ImageCompressor.compress(file);
      console.log("✅ 이미지 압축 완료:", compressedFile.size, "bytes");
      updateUploadProgress(uploadId, 30);

      // 서버에 업로드
      console.log("☁️ 서버 업로드 시작...");
      const url = await uploadImageToServer(compressedFile, (progress) => {
        updateUploadProgress(uploadId, 30 + progress * 0.7);
      });
      console.log("✅ 서버 업로드 완료, URL:", url);

      // 에디터에 이미지 삽입
      console.log("📝 에디터에 이미지 삽입 중...");
      insertImageCallback(url);
      console.log("✅ 에디터 삽입 완료");

      // 업로딩 완료 처리
      setUploadStatus(uploadId, "completed");
      updateUploadProgress(uploadId, 100);
      setTimeout(() => {
        removeUploadingFile(uploadId);
      }, 1000);
    } catch (error) {
      console.error("❌ 이미지 업로드 실패:", error);
      setUploadStatus(uploadId, "error");
      setTimeout(() => {
        removeUploadingFile(uploadId);
      }, 3000);

      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      throw new Error(`이미지 업로드에 실패했습니다: ${errorMessage}`);
    }
  };

  return {
    uploadingImages: readonly(uploadingImages),
    uploading: readonly(uploading),
    addUploadingFile,
    removeUploadingFile,
    updateUploadProgress,
    setUploadStatus,
    uploadImageToServer,
    processImageFile,
  };
};
