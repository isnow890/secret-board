// server/api/comments/recent.get.ts
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 5, 20)
    
    const supabase = await serverSupabaseClient<Database>(event)
    
    // 최근 댓글을 게시글 제목과 함께 조회
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        nickname,
        post_id,
        is_author,
        depth,
        created_at,
        posts!inner (
          id,
          title
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('최근 댓글 조회 실패:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '최근 댓글을 불러오는데 실패했습니다.'
      })
    }

    // 데이터 변환
    const transformedComments = comments?.map(comment => ({
      id: comment.id,
      content: comment.content,
      nickname: comment.nickname,
      post_id: comment.post_id,
      post_title: comment.posts.title,
      is_author: comment.is_author,
      depth: comment.depth,
      created_at: comment.created_at
    })) || []

    return {
      success: true,
      data: {
        comments: transformedComments
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('최근 댓글 API 오류:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다.'
    })
  }
})