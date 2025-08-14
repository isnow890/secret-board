/**
 * @description 특정 ID의 게시글을 삭제하는 API 엔드포인트입니다.
 * 소프트 삭제(soft delete)를 수행하며, 게시글 내용과 첨부파일 정보를 제거하고 `is_deleted` 플래그를 true로 설정합니다.
 * 게시글에 포함된 이미지와 첨부파일은 스토리지에서 물리적으로 삭제합니다.
 * @see /api/posts/:id
 * @method DELETE
 * @param {object} event - H3 이벤트 객체
 * @returns {Promise<object>} 삭제 성공 메시지와 삭제된 파일 수를 포함하는 응답 객체
 * @throws {400} 게시글 ID 또는 비밀번호가 없는 경우
 * @throws {401} 비밀번호가 일치하지 않는 경우
 * @throws {404} 해당 ID의 게시글을 찾을 수 없는 경우
 * @throws {500} 서버 오류 발생 시
 */
import { serverSupabaseClient } from "#supabase/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Database } from '~/types/supabase';
import { extractImagePathsFromHtml } from '~/utils/imageUtils';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

/**
 * @description 게시글 삭제 요청을 위한 Zod 유효성 검사 스키마
 */
const deletePostSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요")
});

export default withApiKeyValidation(async (event) => {
  try {
    const postId = getRouterParam(event, 'id')
    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: '게시글 ID가 필요합니다.'
      })
    }

    const body = await readBody(event)
    const { password } = deletePostSchema.parse(body)

    const supabase = await serverSupabaseClient<Database>(event)

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

    const isValidPassword = await bcrypt.compare(password, post.password_hash)
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: '비밀번호가 올바르지 않습니다.'
      })
    }

    const imagePaths = extractImagePathsFromHtml(post.content)
    const attachedFiles = (post as any)?.attached_files || []
    
    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('post-images')
        .remove(imagePaths)
      if (storageError) {
        console.error('이미지 삭제 중 오류:', storageError)
      }
    }

    if (attachedFiles.length > 0) {
      for (const attachedFile of attachedFiles) {
        try {
          const urlParts = attachedFile.url.split('/storage/v1/object/public/attachments/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            const { error: deleteError } = await supabase.storage
              .from('attachments')
              .remove([filePath]);
            if (deleteError) {
              console.error(`첨부파일 삭제 실패: ${filePath}`, deleteError);
            }
          }
        } catch (deleteErr) {
          console.error("첨부파일 삭제 중 오류:", deleteErr);
        }
      }
    }

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