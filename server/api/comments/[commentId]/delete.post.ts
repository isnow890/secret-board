// server/api/comments/[commentId]/delete.post.ts
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam, validateAndParseBody, verifyPasswordSchema } from '~/server/utils/validation';
import { CommentService } from '~/server/services/commentService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const commentId = validateUuidParam(getRouterParam(event, 'commentId'), '댓글 ID');
  
  // 요청 데이터 검증 및 파싱
  const { password } = await validateAndParseBody(event, verifyPasswordSchema);
  
  // 댓글 삭제
  const result = await CommentService.deleteComment(event, commentId, password);
  
  return {
    success: true,
    data: {
      deleted: true,
      soft_deleted: true,
      comment_id: commentId,
    },
    timestamp: new Date().toISOString(),
  };
}));