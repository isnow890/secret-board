// server/api/comments/[commentId]/verify.post.ts
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam, validateAndParseBody, verifyPasswordSchema } from '~/server/utils/validation';
import { CommentService } from '~/server/services/commentService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const commentId = validateUuidParam(getRouterParam(event, 'commentId'), '댓글 ID');
  
  // 요청 데이터 검증 및 파싱
  const { password } = await validateAndParseBody(event, verifyPasswordSchema);
  
  // 댓글 비밀번호 확인
  const result = await CommentService.verifyPassword(event, commentId, password);
  
  return {
    success: true,
    valid: result.valid,
    message: result.valid ? '비밀번호가 확인되었습니다.' : '비밀번호가 일치하지 않습니다.',
    timestamp: new Date().toISOString(),
  };
}));
