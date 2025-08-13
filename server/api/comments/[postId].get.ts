// server/api/comments/[postId].get.ts
import { getRouterParam } from 'h3';
import { validateUuidParam } from '~/server/utils/validation';
import { CommentService } from '~/server/services/commentService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const postId = validateUuidParam(getRouterParam(event, 'postId'), '게시글 ID');
  
  // 댓글 목록 조회
  const result = await CommentService.getComments(event, postId);
  
  return {
    success: true,
    data: result.comments,
    meta: {
      total: result.total_count,
    },
    timestamp: new Date().toISOString(),
  };
});
