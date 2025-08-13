// server/api/comments/[commentId]/edit.post.ts
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam, validateAndParseBody, updateCommentSchema } from '~/server/utils/validation';
import { CommentService } from '~/server/services/commentService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const commentId = validateUuidParam(getRouterParam(event, 'commentId'), '댓글 ID');
  
  // 요청 데이터 검증 및 파싱
  const commentData = await validateAndParseBody(event, updateCommentSchema);
  
  // 댓글 수정
  const updatedComment = await CommentService.updateComment(event, commentId, commentData);
  
  return {
    success: true,
    message: '댓글이 수정되었습니다.',
    data: updatedComment,
    timestamp: new Date().toISOString(),
  };
}));
