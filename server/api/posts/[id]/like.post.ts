// server/api/posts/[id]/like.post.ts
import { getRouterParam } from 'h3';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam } from '~/server/utils/validation';
import { PostService } from '~/server/services/postService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const postId = validateUuidParam(getRouterParam(event, 'id'), '게시글 ID');
  
  // 게시글 좋아요 토글
  const result = await PostService.toggleLike(event, postId);
  
  return {
    success: true,
    data: {
      id: postId,
      like_count: result.likeCount,
      liked: result.liked,
    },
    timestamp: new Date().toISOString(),
  };
}));
