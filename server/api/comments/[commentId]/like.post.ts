/**
 * @description 댓글 좋아요 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 */
import { z } from 'zod';
import { 
  validateUUIDOrThrow,
  createSuccessResponse,
  CommonErrors,
  getSupabaseClient,
  findCommentById,
  updateLikeCount,
  createApiHandler
} from '~/server/utils';

const likeSchema = z.object({
  liked: z.boolean({ message: 'liked 값은 boolean이어야 합니다.' })
});

export default createApiHandler(async (event) => {
  // 1. 라우터 파라미터에서 댓글 ID 추출 및 검증
  const commentId = getRouterParam(event, "commentId");
  validateUUIDOrThrow(commentId, '댓글 ID');

  // 2. 요청 본문 검증
  const body = await readBody(event);
  const { liked } = likeSchema.parse(body);

  // 3. 댓글 존재 확인
  const supabase = await getSupabaseClient(event);
  const comment = await findCommentById(supabase, commentId!, false); // 삭제된 댓글 제외

  if (!comment) {
    throw CommonErrors.NotFound.Comment();
  }

  // 4. 좋아요 수 업데이트
  const increment = liked ? 1 : -1;
  const newLikeCount = await updateLikeCount(supabase, 'comments', commentId!, increment);

  // 5. 성공 응답
  return createSuccessResponse({
    id: commentId,
    like_count: newLikeCount,
    liked,
  }, `댓글 ${liked ? '좋아요' : '좋아요 취소'}가 완료되었습니다.`);

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '댓글 좋아요 처리 중 오류가 발생했습니다.'
});
