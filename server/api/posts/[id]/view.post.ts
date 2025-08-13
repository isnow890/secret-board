// server/api/posts/[id]/view.post.ts
import { getRouterParam } from 'h3';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam } from '~/server/utils/validation';
import { PostService } from '~/server/services/postService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const postId = validateUuidParam(getRouterParam(event, 'id'), '게시글 ID');
  
  // 조회수 증가
  const result = await PostService.incrementViewCount(event, postId);
  
  return {
    success: result.success,
    timestamp: new Date().toISOString(),
  };
}));