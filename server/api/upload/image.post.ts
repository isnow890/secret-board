// server/api/upload/image.post.ts
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
    
    // 파일 검증
    if (!file.type?.startsWith('image/')) {
      throw createError({
        statusCode: 400,
        statusMessage: '이미지 파일만 업로드 가능합니다.'
      })
    }

    if (!file.data || file.data.length > 10 * 1024 * 1024) { // 10MB
      throw createError({
        statusCode: 400,
        statusMessage: '파일 크기는 10MB 이하여야 합니다.'
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
    let ext = 'jpg'
    if (file.filename) {
      const fileExt = file.filename.split('.').pop()?.toLowerCase()
      if (fileExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        ext = fileExt === 'jpeg' ? 'jpg' : fileExt
      }
    } else if (file.type) {
      const typeExt = file.type.split('/')[1]
      if (typeExt && ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(typeExt)) {
        ext = typeExt === 'jpeg' ? 'jpg' : typeExt
      }
    }
    
    const filename = `image_${timestamp}_${random}.${ext}`
    const filePath = `${year}/${month}/${day}/${filename}`

    // Supabase Storage에 업로드
    const supabase = await serverSupabaseClient<Database>(event)
    
    const { error } = await supabase.storage
      .from('post-images')
      .upload(filePath, file.data, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '파일 업로드에 실패했습니다: ' + error.message
      })
    }

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        filename,
        url: urlData.publicUrl,
        size: file.data?.length || 0,
        path: filePath
      },
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    console.error('Image upload error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다: ' + (error.message || 'Unknown error')
    })
  }
})