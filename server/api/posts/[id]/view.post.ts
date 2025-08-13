// server/api/posts/[id]/view.post.ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from '~/types/supabase';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

export default withApiKeyValidation(async (event) => {
  try {
    const postId = getRouterParam(event, 'id')
    
    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: '게시글 ID가 필요합니다.'
      })
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(postId)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바르지 않은 게시글 ID입니다.'
      })
    }
    
    const supabase = await serverSupabaseClient<Database>(event)
    
    // 게시글 존재 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, view_count')
      .eq('id', postId)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: '게시글을 찾을 수 없습니다.'
        })
      }
      
      console.error('Post fetch error:', fetchError)
      throw createError({
        statusCode: 500,
        statusMessage: '게시글 조회에 실패했습니다.'
      })
    }
    
    // 조회수 증가
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ 
        view_count: (existingPost.view_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select('view_count')
      .single()
    
    if (updateError) {
      console.error('View count update error:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: '조회수 업데이트에 실패했습니다.'
      })
    }
    
    return {
      success: true,
      data: {
        view_count: updatedPost.view_count
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('View increment error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다.'
    })
  }
})