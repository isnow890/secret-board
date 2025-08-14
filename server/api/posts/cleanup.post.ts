/**
 * @description 게시글 정리 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 * 소프트 삭제된 게시글을 영구 삭제하며, 관련 파일들도 함께 삭제합니다.
 */
import { 
  createSuccessResponse,
  getSupabaseClient,
  createApiHandler
} from '~/server/utils';
import { extractImagePathsFromHtml } from '~/utils/imageUtils';

export default createApiHandler(async (event) => {
  console.log('게시글 정리 작업 시작');
  
  // 1. Supabase 클라이언트 생성
  const supabase = await getSupabaseClient(event);

  // 2. 인기글에서 제외된 soft delete 게시글들 찾기
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: trendingPosts } = await supabase
    .from("posts")
    .select("id")
    .gte("created_at", twentyFourHoursAgo.toISOString())
    .eq("is_deleted", false)
    .order("view_count", { ascending: false })
    .order("like_count", { ascending: false })
    .limit(20);

  const trendingPostIds = trendingPosts?.map(p => p.id) || [];

  // 3. soft delete된 게시글 중 인기글에 없는 것들 찾기
  let postsToDeleteQuery = supabase
    .from("posts")
    .select("id, content, attached_files")
    .eq("is_deleted", true);

  if (trendingPostIds.length > 0) {
    postsToDeleteQuery = postsToDeleteQuery.not("id", "in", `(${trendingPostIds.join(",")})`);
  }

  const { data: postsToDelete, error: fetchError } = await postsToDeleteQuery;

  if (fetchError) {
    console.error("삭제 대상 게시글 조회 실패:", fetchError);
    throw createError({
      statusCode: 500,
      statusMessage: "삭제 대상 게시글 조회에 실패했습니다."
    });
  }

  if (!postsToDelete || postsToDelete.length === 0) {
    return createSuccessResponse({
      deletedCount: 0,
      deletedImages: 0,
      deletedAttachments: 0
    }, "삭제할 게시글이 없습니다.");
  }

  console.log(`${postsToDelete.length}개의 게시글을 완전 삭제 예정`);

  let deletedImagesCount = 0;
  let deletedAttachmentsCount = 0;

  // 4. 각 게시글의 이미지와 첨부파일 삭제
  for (const post of postsToDelete) {
    try {
      const imagePaths = extractImagePathsFromHtml(post.content || '');
      
      if (imagePaths.length > 0) {
        const { error: imageDeleteError } = await supabase.storage
          .from('post-images')
          .remove(imagePaths);
        
        if (!imageDeleteError) {
          deletedImagesCount += imagePaths.length;
        } else {
          console.error(`게시글 ${post.id} 이미지 삭제 실패:`, imageDeleteError);
        }
      }

      const attachedFiles = (post as any)?.attached_files || [];
      if (attachedFiles.length > 0) {
        for (const attachedFile of attachedFiles) {
          try {
            const urlParts = attachedFile.url.split('/storage/v1/object/public/attachments/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              const { error: deleteError } = await supabase.storage
                .from('attachments')
                .remove([filePath]);
              if (!deleteError) {
                deletedAttachmentsCount += 1;
              } else {
                console.error(`첨부파일 삭제 실패: ${filePath}`, deleteError);
              }
            }
          } catch (deleteErr) {
            console.error("첨부파일 삭제 중 오류:", deleteErr);
          }
        }
      }
    } catch (fileError) {
      console.error(`게시글 ${post.id} 파일 삭제 중 오류:`, fileError);
    }
  }

  // 5. 관련 댓글들 완전 삭제
  const postIds = postsToDelete.map(p => p.id);
  
  const { error: commentsDeleteError } = await supabase
    .from('comments')
    .delete()
    .in('post_id', postIds);

  if (commentsDeleteError) {
    console.error("댓글 삭제 실패:", commentsDeleteError);
  }

  // 6. 게시글들 완전 삭제
  const { error: postsDeleteError } = await supabase
    .from('posts')
    .delete()
    .in('id', postIds);

  if (postsDeleteError) {
    console.error("게시글 완전 삭제 실패:", postsDeleteError);
    throw createError({
      statusCode: 500,
      statusMessage: "게시글 완전 삭제에 실패했습니다."
    });
  }

  console.log(`게시글 정리 완료: ${postsToDelete.length}개 게시글, ${deletedImagesCount}개 이미지, ${deletedAttachmentsCount}개 첨부파일 삭제`);

  // 7. 성공 응답
  return createSuccessResponse({
    deletedCount: postsToDelete.length,
    deletedImages: deletedImagesCount,
    deletedAttachments: deletedAttachmentsCount
  }, "게시글 정리가 완료되었습니다.");

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '게시글 정리 중 오류가 발생했습니다.'
});