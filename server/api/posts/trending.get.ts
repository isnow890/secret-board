// server/api/posts/trending.get.ts
import { getQuery } from 'h3';
import { PostService } from '~/server/services/postService';
import { withErrorHandler } from '~/server/utils/errorHandler';

export default withErrorHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.min(parseInt(query.limit as string) || 5, 20);
  
  // 인기 게시글 조회
  const posts = await PostService.getTrendingPosts(event, limit);
  
  return {
    success: true,
    data: {
      posts,
    },
    timestamp: new Date().toISOString(),
  };
});
