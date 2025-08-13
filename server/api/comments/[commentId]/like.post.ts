// server/api/comments/[commentId]/like.post.ts
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam } from '~/server/utils/validation';
import { CommentService } from '~/server/services/commentService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const commentId = validateUuidParam(getRouterParam(event, 'commentId'), '댓글 ID');
  
  // 댓글 좋아요 토글
  const result = await CommentService.toggleLike(event, commentId);
  
  return {
    success: true,
    data: {
      id: commentId,
      like_count: result.likeCount,
      liked: result.liked,
    },
    timestamp: new Date().toISOString(),
  };
}));
