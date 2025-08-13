// server/api/posts/[id].delete.ts
import { serverSupabaseClient } from "#supabase/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Database } from '~/types/supabase';
import { extractImagePathsFromHtml } from '~/utils/imageUtils';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

const deletePostSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요")
});

export default withApiKeyValidation(async (event) => {
  try {
    // POST ID 추출
    const postId = getRouterParam(event, 'id')
    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: '게시글 ID가 필요합니다.'
      })
    }

    // 요청 본문 파싱
    const body = await readBody(event)
    const { password } = deletePostSchema.parse(body)

    const supabase = await serverSupabaseClient<Database>(event)

    // 게시글 존재 확인 및 가져오기 (삭제되지 않은 게시글만, 첨부파일 정보 포함)
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, password_hash, content, is_deleted, attached_files')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !post) {
      throw createError({
        statusCode: 404,
        statusMessage: '게시글을 찾을 수 없습니다.'
      })
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, post.password_hash)
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: '비밀번호가 올바르지 않습니다.'
      })
    }

    // 게시글에서 이미지 경로들 추출 (soft delete에서도 이미지는 삭제)
    const imagePaths = extractImagePathsFromHtml(post.content)
    
    // 첨부파일 정보 추출
    const attachedFiles = (post as any)?.attached_files || []
    
    // 이미지들이 있다면 Storage에서 삭제
    if (imagePaths.length > 0) {
      console.log(`게시글 ${postId} 삭제: ${imagePaths.length}개 이미지 삭제 시도`)
      
      const { error: storageError } = await supabase.storage
        .from('post-images')
        .remove(imagePaths)
      
      if (storageError) {
        console.error('이미지 삭제 중 오류:', storageError)
        // 이미지 삭제 실패해도 게시글은 삭제 진행
      } else {
        console.log(`게시글 ${postId}: ${imagePaths.length}개 이미지 삭제 완료`)
      }
    }

    // 첨부파일들이 있다면 Storage에서 삭제
    if (attachedFiles.length > 0) {
      console.log(`게시글 ${postId} 삭제: ${attachedFiles.length}개 첨부파일 삭제 시도`)
      
      for (const attachedFile of attachedFiles) {
        try {
          // URL에서 파일 경로 추출 (예: https://...supabase.co/storage/v1/object/public/attachments/2024/01/15/file.pdf)
          const urlParts = attachedFile.url.split('/storage/v1/object/public/attachments/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            
            const { error: deleteError } = await supabase.storage
              .from('attachments')
              .remove([filePath]);
            
            if (deleteError) {
              console.error(`첨부파일 삭제 실패: ${filePath}`, deleteError);
              // 첨부파일 삭제 실패해도 게시글은 삭제 진행
            } else {
              console.log(`첨부파일 삭제 완료: ${filePath}`);
            }
          }
        } catch (deleteErr) {
          console.error("첨부파일 삭제 중 오류:", deleteErr);
          // 첨부파일 삭제 실패해도 게시글은 삭제 진행
        }
      }
    }

    // Soft Delete: 게시글 내용을 삭제하고 is_deleted를 true로 설정
    const { error: deleteError } = await supabase
      .from('posts')
      .update({
        title: '삭제된 게시글입니다',
        content: '<p>삭제된 게시글입니다.</p>',
        attached_files: null,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        has_attachments: false,
        attachment_count: 0
      })
      .eq('id', postId)

    if (deleteError) {
      console.error('게시글 삭제 실패:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: '게시글 삭제에 실패했습니다.'
      })
    }

    return {
      success: true,
      message: '게시글이 삭제되었습니다.',
      deletedImages: imagePaths.length,
      deletedAttachments: attachedFiles.length
    }

  } catch (error: any) {
    console.error('게시글 삭제 오류:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다.'
    })
  }
})