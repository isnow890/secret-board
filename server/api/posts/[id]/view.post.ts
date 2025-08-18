/**
 * @description 게시글 조회수 증가 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 */
import { 
  validateUUIDOrThrow,
  createSuccessResponse,
  CommonErrors,
  getSupabaseClient,
  createApiHandler
} from '~/server/utils';

export default createApiHandler(async (event) => {
  // 1. 라우터 파라미터에서 게시글 ID 추출 및 검증
  const postId = getRouterParam(event, 'id');
  validateUUIDOrThrow(postId, '게시글 ID');
  
  // 2. Supabase 클라이언트 생성
  const supabase = await getSupabaseClient(event);
  
  // 3. 게시글 존재 확인
  const { data: existingPost, error: fetchError } = await supabase
    .from('posts')
    .select('id, view_count')
    .eq('id', postId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw CommonErrors.NotFound.Post();
    }
    
    console.error('Post fetch error:', fetchError);
    throw createError({
      statusCode: 500,
      statusMessage: '게시글 조회에 실패했습니다.'
    });
  }
  
  // 4. 조회수 증가
  const { data: updatedPost, error: updateError } = await supabase
    .from('posts')
    .update({ 
      view_count: (existingPost.view_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .select('view_count')
    .single();
  
  if (updateError) {
    console.error('View count update error:', updateError);
    throw createError({
      statusCode: 500,
      statusMessage: '조회수 업데이트에 실패했습니다.'
    });
  }
  
  // 5. 성공 응답
  return createSuccessResponse({
    view_count: updatedPost.view_count
  }, '조회수가 증가되었습니다.');
  
}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '조회수 업데이트 중 오류가 발생했습니다.'
});