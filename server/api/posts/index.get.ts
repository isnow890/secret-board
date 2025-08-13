// server/api/posts/index.get.ts
import { PostService } from '~/server/services/postService';
import { withErrorHandler } from '~/server/utils/errorHandler';
import { logApiCall } from '~/utils/logger';

export default withErrorHandler(async (event) => {
  const startTime = Date.now();
  
  const query = getQuery(event);
  const params = {
    page: query.page ? Math.max(1, Number(query.page)) : undefined,
    limit: Math.min(Number(query.limit) || 20, 50),
    sort: Array.isArray(query.sort) ? query.sort[0] : query.sort || 'created',
    search: query.search ? String(query.search).trim() : undefined,
  };
  
  // 게시글 목록 조회
  const result = await PostService.getPosts(event, params);
  
  const response = {
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  };
  
  // 성공 로깅
  const responseTime = Date.now() - startTime;
  logApiCall('GET', '/api/posts', responseTime, 200);
  
  return response;
});
