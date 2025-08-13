// server/api/comments/index.post.ts
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateAndParseBody, createCommentSchema } from '~/server/utils/validation';
import { CommentService } from '~/server/services/commentService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // 요청 데이터 검증 및 파싱
  const commentData = await validateAndParseBody(event, createCommentSchema);
  
  // 댓글 생성
  const comment = await CommentService.createComment(event, commentData);
  
  return {
    success: true,
    data: comment,
    timestamp: new Date().toISOString(),
  };
}));
