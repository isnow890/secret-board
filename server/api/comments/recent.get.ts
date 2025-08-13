// server/api/comments/recent.get.ts
import { CommentService } from '~/server/services/commentService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withErrorHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.min(parseInt(query.limit as string) || 5, 20);
  
  // 최근 댓글 조회
  const comments = await CommentService.getRecentComments(event, limit);
  
  return {
    success: true,
    data: {
      comments,
    },
    timestamp: new Date().toISOString(),
  };
});