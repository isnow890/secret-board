// server/api/posts/[id].get.ts
import { getRouterParam } from 'h3';
import { validateUuidParam } from '~/server/utils/validation';
import { PostService } from '~/server/services/postService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withErrorHandler(async (event) => {
  // UUID 매개변수 검증
  const postId = validateUuidParam(getRouterParam(event, 'id'), '게시글 ID');
  
  // 게시글 조회
  const post = await PostService.getPost(event, postId);
  
  return {
    success: true,
    data: post,
    timestamp: new Date().toISOString(),
  };
});