<!-- components/editor/FileUploader.vue -->
<template>
  <div class="file-uploader">
    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z"
      class="hidden"
      @change="handleFileSelect"
    />
    
    <div
      class="drag-zone border-2 border-dashed rounded-lg p-6 text-center hover:border-border-strong transition-colors cursor-pointer"
      :class="{ 'border-accent-blue bg-accent-blue/10': isDragging }"
      :style="{ 
        borderColor: isDragging ? '' : 'var(--color-border-default)',
        backgroundColor: isDragging ? '' : 'var(--color-bg-secondary)'
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @click="openFileDialog"
    >
      <Icon name="lucide:upload" class="w-12 h-12 mx-auto text-text-tertiary mb-4" />
      <p class="text-text-secondary font-medium mb-2">
        파일을 드래그하여 업로드하거나 <span class="text-accent-blue underline">클릭하여 선택</span>
      </p>
      <p class="text-sm text-text-tertiary">
        PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, ZIP, RAR, 7Z (최대 5개, 각 5MB)
      </p>
    </div>

    <!-- 업로드 진행률 -->
    <div v-if="uploadingFiles.length > 0" class="mt-4 space-y-2">
      <div
        v-for="file in uploadingFiles"
        :key="file.id"
        class="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-border-muted"
      >
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <Icon name="lucide:file" class="w-5 h-5 text-text-tertiary flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-text-primary truncate">{{ file.name }}</p>
            <p class="text-xs text-text-tertiary">{{ formatFileSize(file.size) }}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2 ml-4">
          <div v-if="file.status === 'uploading'" class="flex items-center space-x-2">
            <div class="w-20 bg-background-tertiary rounded-full h-2">
              <div
                class="bg-accent-blue h-2 rounded-full transition-all duration-300"
                :style="{ width: `${file.progress}%` }"
              ></div>
            </div>
            <span class="text-xs text-text-tertiary w-8 text-right">{{ file.progress }}%</span>
          </div>
          
          <div v-else-if="file.status === 'completed'" class="text-status-success">
            <Icon name="lucide:check" class="w-5 h-5" />
          </div>
          
          <div v-else-if="file.status === 'error'" class="text-status-error">
            <Icon name="lucide:x" class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- 업로드된 파일 목록 -->
    <div v-if="uploadedFiles.length > 0" class="mt-4">
      <h4 class="text-sm font-medium text-text-primary mb-2">첨부된 파일 ({{ uploadedFiles.length }}개)</h4>
      <div class="space-y-2">
        <div
          v-for="file in uploadedFiles"
          :key="file.url"
          class="flex items-center justify-between p-3 bg-status-success/10 rounded-lg border border-status-success/30"
        >
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <Icon name="lucide:file-check" class="w-5 h-5 text-status-success flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-text-primary truncate">{{ file.filename }}</p>
              <p class="text-xs text-status-success">{{ formatFileSize(file.size) }}</p>
            </div>
          </div>
          
          <button
            @click="removeFile(file.url)"
            class="text-status-error hover:text-status-error/80 transition-colors p-1 rounded hover:bg-status-error/10"
            title="파일 제거"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadingFile, UploadedFile } from '~/types'

interface Props {
  modelValue: UploadedFile[]
  maxFiles?: number
}

interface Emits {
  (e: 'update:modelValue', files: UploadedFile[]): void
  (e: 'upload-start', file: File): void
  (e: 'upload-complete', file: UploadedFile): void
  (e: 'upload-error', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
  maxFiles: 10
})

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const uploadingFiles = ref<UploadingFile[]>([])
const uploadedFiles = ref<UploadedFile[]>([...props.modelValue])

const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    uploadFiles(Array.from(target.files))
    // input 값 초기화
    target.value = ''
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // 드래그가 자식 요소로 이동하는 경우 무시
  if (!(event.currentTarget as Element)?.contains(event.relatedTarget as Node)) {
    isDragging.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (files) {
    uploadFiles(Array.from(files))
  }
}

const uploadFiles = async (files: File[]) => {
  // 파일 수 제한 체크
  if (uploadedFiles.value.length + files.length > props.maxFiles) {
    alert(`최대 ${props.maxFiles}개의 파일만 업로드 가능합니다.`)
    return
  }

  for (const file of files) {
    if (!validateFile(file)) continue
    
    const uploadingFile: UploadingFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    }
    
    uploadingFiles.value.push(uploadingFile)
    emit('upload-start', file)
    
    try {
      const uploadedFile = await uploadFile(file, (progress) => {
        updateUploadProgress(uploadingFile.id, progress)
      })
      
      uploadingFile.status = 'completed'
      uploadedFiles.value.push(uploadedFile)
      emit('update:modelValue', uploadedFiles.value)
      emit('upload-complete', uploadedFile)
      
      // 업로딩 목록에서 제거 (1초 후)
      setTimeout(() => {
        removeUploadingFile(uploadingFile.id)
      }, 1000)
      
    } catch (error) {
      uploadingFile.status = 'error'
      const errorMessage = error instanceof Error ? error.message : '파일 업로드에 실패했습니다.'
      emit('upload-error', errorMessage)
      
      // 에러 상태 3초 후 제거
      setTimeout(() => {
        removeUploadingFile(uploadingFile.id)
      }, 3000)
    }
  }
}

const validateFile = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed', // 추가 ZIP MIME 타입
    'application/zip-compressed',   // 추가 ZIP MIME 타입
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
  
  // 디버깅: 클라이언트에서 파일 MIME 타입 로깅
  console.log('📁 클라이언트 파일 정보:');
  console.log('  - 파일명:', file.name);
  console.log('  - MIME 타입:', file.type);
  console.log('  - 파일 크기:', file.size);
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.zip', '.rar', '.7z']
  
  // MIME 타입 또는 확장자로 검증
  const isValidType = allowedTypes.includes(file.type) || 
    allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  
  if (!isValidType) {
    alert('지원하지 않는 파일 형식입니다.\n지원 형식: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, ZIP, RAR, 7Z')
    return false
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    alert('파일 크기는 5MB 이하여야 합니다.')
    return false
  }
  
  return true
}

const uploadFile = async (
  file: File, 
  onProgress: (progress: number) => void
): Promise<UploadedFile> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            resolve(response.data)
          } else {
            reject(new Error(response.error || '업로드 실패'))
          }
        } catch {
          reject(new Error('응답 파싱 실패'))
        }
      } else {
        reject(new Error(`업로드 실패 (${xhr.status})`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(new Error('네트워크 오류가 발생했습니다.'))
    })
    
    xhr.addEventListener('timeout', () => {
      reject(new Error('업로드 시간이 초과되었습니다.'))
    })
    
    xhr.timeout = 30000 // 30초 타임아웃
    
    // Add API key header for server validation
    try {
      const config = useRuntimeConfig();
      const clientApiKey = config.public?.serverApiKey as string | undefined;
      
      // Account for baseURL in request
      const baseURL = config.app?.baseURL || '';
      const uploadUrl = baseURL.endsWith('/') ? `${baseURL}api/upload/file` : `${baseURL}/api/upload/file`;
      
      console.log('🔑 Upload URL:', uploadUrl);
      console.log('🔑 API Key:', clientApiKey);
      
      xhr.open('POST', uploadUrl);
      if (clientApiKey) {
        xhr.setRequestHeader('x-api-key', clientApiKey);
      }
    } catch {
      // Fallback: open without header if runtime config is not available
      xhr.open('POST', '/secret/api/upload/file');
    }
    xhr.send(formData)
  })
}

const updateUploadProgress = (id: string, progress: number) => {
  const upload = uploadingFiles.value.find(u => u.id === id)
  if (upload) {
    upload.progress = Math.round(progress)
  }
}

const removeUploadingFile = (id: string) => {
  const index = uploadingFiles.value.findIndex(u => u.id === id)
  if (index > -1) {
    uploadingFiles.value.splice(index, 1)
  }
}

const removeFile = (url: string) => {
  const index = uploadedFiles.value.findIndex(f => f.url === url)
  if (index > -1) {
    uploadedFiles.value.splice(index, 1)
    emit('update:modelValue', uploadedFiles.value)
  }
}

const formatFileSize = (bytes: number): string => {
  return ImageCompressor.formatFileSize(bytes)
}

// 부모 컴포넌트의 modelValue 변경 감지
watch(() => props.modelValue, (newFiles) => {
  uploadedFiles.value = [...newFiles]
}, { deep: true })

// 컴포넌트 노출 메서드
defineExpose({
  clearFiles: () => {
    uploadedFiles.value = []
    emit('update:modelValue', [])
  },
  getFiles: () => uploadedFiles.value,
  isUploading: () => uploadingFiles.value.length > 0
})
</script>