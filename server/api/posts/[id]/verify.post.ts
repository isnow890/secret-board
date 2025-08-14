/**
 * @description 게시글 비밀번호 검증 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 */
import { z } from 'zod';
import { 
  validateUUIDOrThrow,
  createSuccessResponse,
  getSupabaseClient,
  findPostById,
  comparePassword,
  createApiHandler
} from '~/server/utils';

const verifySchema = z.object({
  password: z.string().min(4).max(4)
});

export default createApiHandler(async (event) => {
  // 1. 라우터 파라미터에서 ID 추출 및 검증
  const postId = getRouterParam(event, 'id');
  validateUUIDOrThrow(postId, '게시글 ID');

  // 2. 요청 본문 파싱 및 검증
  const body = await readBody(event);
  const result = verifySchema.safeParse(body);
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '올바른 비밀번호를 입력해주세요.'
    });
  }
  
  const { password } = result.data;
  
  // 3. 데이터베이스에서 게시글 조회
  const supabase = await getSupabaseClient(event);
  const post = await findPostById(supabase, postId!, false); // 삭제된 게시글 제외
  
  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: '게시글을 찾을 수 없습니다.'
    });
  }
  
  // 4. 비밀번호 검증
  const isPasswordValid = await comparePassword(password, post.password_hash);
  
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: '비밀번호가 일치하지 않습니다.'
    });
  }
  
  // 5. 성공 응답 반환
  return createSuccessResponse(null, '비밀번호가 확인되었습니다.');

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '비밀번호 확인 중 오류가 발생했습니다.'
});