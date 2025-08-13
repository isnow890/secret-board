// server/api/upload/file.post.ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from '~/types/supabase';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

export default withApiKeyValidation(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '파일이 업로드되지 않았습니다.'
      })
    }

    const file = formData[0]
    
    // 파일 존재 확인
    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: '파일이 없습니다.'
      })
    }
    
    // 허용된 파일 타입 검사
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

    // 디버깅: 업로드된 파일 정보 로깅
    console.log('📁 업로드된 파일 정보:');
    console.log('  - 파일명:', file.filename);
    console.log('  - MIME 타입:', file.type);
    console.log('  - 파일 크기:', file.data?.length);

    if (!allowedTypes.includes(file.type || '')) {
      console.error('❌ 지원하지 않는 MIME 타입:', file.type);
      throw createError({
        statusCode: 400,
        statusMessage: `지원하지 않는 파일 형식입니다. (받은 타입: ${file.type})`
      })
    }

    // 파일 크기 검사 (5MB)
    if (!file.data || file.data.length > 5 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        statusMessage: '파일 크기는 5MB 이하여야 합니다.'
      })
    }

    // 파일명 생성
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    
    // 확장자 추출
    let ext = 'bin'
    if (file.filename) {
      const fileExt = file.filename.split('.').pop()?.toLowerCase()
      if (fileExt) {
        ext = fileExt
      }
    }
    
    const filename = `file_${timestamp}_${random}.${ext}`
    const filePath = `${year}/${month}/${day}/${filename}`

    // Supabase Storage에 업로드
    const supabase = await serverSupabaseClient<Database>(event)
    
    const { error } = await supabase.storage
      .from('post-files')
      .upload(filePath, file.data, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase file upload error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '파일 업로드에 실패했습니다: ' + error.message
      })
    }

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from('post-files')
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        filename: file.filename || filename,
        url: urlData.publicUrl,
        size: file.data?.length || 0,
        type: file.type,
        path: filePath
      },
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    console.error('File upload error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다: ' + (error.message || 'Unknown error')
    })
  }
})