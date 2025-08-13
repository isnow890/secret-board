// server/api/posts/[id].delete.ts
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam, validateAndParseBody, verifyPasswordSchema } from '~/server/utils/validation';
import { PostService } from '~/server/services/postService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const postId = validateUuidParam(getRouterParam(event, 'id'), '게시글 ID');
  
  // 요청 데이터 검증 및 파싱
  const { password } = await validateAndParseBody(event, verifyPasswordSchema);
  
  // 게시글 삭제
  const result = await PostService.deletePost(event, postId, password);
  
  return {
    success: true,
    message: '게시글이 삭제되었습니다.',
    timestamp: new Date().toISOString(),
  };
}));