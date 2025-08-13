// server/api/stats/board.get.ts
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient<Database>(event)
    
    // 오늘 날짜 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    
    // 병렬로 모든 통계 조회
    const [
      totalPostsResult,
      totalCommentsResult,
      todayPostsResult,
      todayCommentsResult
    ] = await Promise.all([
      // 전체 게시글 수
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true }),
      
      // 전체 댓글 수 (삭제되지 않은 것만)
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('is_deleted', false),
      
      // 오늘 게시글 수
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      
      // 오늘 댓글 수 (삭제되지 않은 것만)
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .gte('created_at', todayISO)
    ])

    // 에러 체크
    if (totalPostsResult.error) {
      console.error('전체 게시글 수 조회 실패:', totalPostsResult.error)
      throw createError({
        statusCode: 500,
        statusMessage: '통계를 불러오는데 실패했습니다.'
      })
    }

    if (totalCommentsResult.error) {
      console.error('전체 댓글 수 조회 실패:', totalCommentsResult.error)
      throw createError({
        statusCode: 500,
        statusMessage: '통계를 불러오는데 실패했습니다.'
      })
    }

    if (todayPostsResult.error) {
      console.error('오늘 게시글 수 조회 실패:', todayPostsResult.error)
      throw createError({
        statusCode: 500,
        statusMessage: '통계를 불러오는데 실패했습니다.'
      })
    }

    if (todayCommentsResult.error) {
      console.error('오늘 댓글 수 조회 실패:', todayCommentsResult.error)
      throw createError({
        statusCode: 500,
        statusMessage: '통계를 불러오는데 실패했습니다.'
      })
    }

    const stats = {
      totalPosts: totalPostsResult.count || 0,
      totalComments: totalCommentsResult.count || 0,
      todayPosts: todayPostsResult.count || 0,
      todayComments: todayCommentsResult.count || 0,
      lastUpdated: new Date().toISOString()
    }

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('게시판 통계 API 오류:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다.'
    })
  }
})