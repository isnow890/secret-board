// server/api/posts/[id]/edit.post.ts
import { getRouterParam } from 'h3';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateUuidParam, validateAndParseBody, updatePostSchema } from '~/server/utils/validation';
import { PostService } from '~/server/services/postService';
import { withErrorHandler, errors } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const postId = validateUuidParam(getRouterParam(event, 'id'), '게시글 ID');
  
  // 요청 데이터 검증 및 파싱
  const postData = await validateAndParseBody(event, updatePostSchema);
  
  // 게시글 수정
  const updatedPost = await PostService.updatePost(event, postId, postData);
  if (!updatedPost) {
    throw errors.internal('게시글 수정 결과가 없습니다.');
  }
  
  return {
    success: true,
    data: {
  id: updatedPost.id,
  title: updatedPost.title,
  content: updatedPost.content,
  updated_at: updatedPost.updated_at,
    },
    timestamp: new Date().toISOString(),
  };
}));
