/**
 * @description 게시글 좋아요 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 */
import { z } from 'zod';
import { 
  validateUUIDOrThrow,
  createSuccessResponse,
  CommonErrors,
  getSupabaseClient,
  findPostById,
  updateLikeCount,
  createApiHandler,
  setUTF8Header
} from '~/server/utils';

const likeSchema = z.object({
  action: z.enum(['like', 'unlike']).refine(val => val === 'like' || val === 'unlike', {
    message: '올바른 액션을 지정해주세요. (like, unlike)'
  })
});

export default createApiHandler(async (event) => {
  // 1. 라우터 파라미터에서 게시글 ID 추출 및 검증
  const postId = getRouterParam(event, "id");
  validateUUIDOrThrow(postId, '게시글 ID');

  // 2. 요청 본문 검증
  const body = await readBody(event);
  const { action } = likeSchema.parse(body);

  // 3. 게시글 존재 확인
  const supabase = await getSupabaseClient(event);
  const post = await findPostById(supabase, postId!, false); // 삭제된 게시글 제외

  if (!post) {
    throw CommonErrors.NotFound.Post();
  }

  // 4. 좋아요 수 업데이트
  const increment = action === 'like' ? 1 : -1;
  const newLikeCount = await updateLikeCount(supabase, 'posts', postId!, increment);

  // 5. UTF-8 헤더 설정 및 성공 응답
  setUTF8Header(event);
  
  return createSuccessResponse({
    like_count: newLikeCount,
    action,
  }, `게시글 ${action === 'like' ? '좋아요' : '좋아요 취소'}가 완료되었습니다.`);

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '좋아요 처리 중 오류가 발생했습니다.'
});
