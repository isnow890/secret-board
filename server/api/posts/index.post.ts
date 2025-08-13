// server/api/posts/index.post.ts
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';
import { validateAndParseBody, createPostSchema } from '~/server/utils/validation';
import { PostService } from '~/server/services/postService';
import { withErrorHandler, errors } from '~/server/utils/errorHandler';

export default withApiKeyValidation(withErrorHandler(async (event) => {
  // 요청 데이터 검증 및 파싱
  const postData = await validateAndParseBody(event, createPostSchema);
  
  // 게시글 생성
  const post = await PostService.createPost(event, postData);
  if (!post) {
    throw errors.internal('게시글 생성 결과가 없습니다.');
  }
  
  return {
    success: true,
    data: {
  id: post.id,
  title: post.title,
  created_at: post.created_at,
    },
    timestamp: new Date().toISOString(),
  };
}));