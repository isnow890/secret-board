/**
 * @description 소프트 삭제된 게시글 중 특정 조건을 만족하는 게시글을 영구적으로 삭제(hard delete)하는 API 엔드포인트입니다.
 * - 인기글 목록에 포함되지 않은 소프트 삭제 게시글을 대상으로 합니다.
 * - 관련 댓글, 스토리지의 이미지 및 첨부파일을 모두 삭제합니다.
 * - 주로 스케줄링된 작업(cron job)에 의해 호출됩니다.
 * @see /api/posts/cleanup
 * @method POST
 * @param {object} event - H3 이벤트 객체
 * @returns {Promise<object>} 정리 작업 결과를 포함하는 응답 객체
 * @throws {500} 서버 오류 발생 시
 */
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { extractImagePathsFromHtml } from '~/utils/imageUtils';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

export default withApiKeyValidation(async (event) => {
  try {
    console.log('게시글 정리 작업 시작');
    
    const supabase = await serverSupabaseClient<Database>(event);

    // 1. 인기글에서 제외된 soft delete 게시글들 찾기
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

    // 2. soft delete된 게시글 중 인기글에 없는 것들 찾기
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
      return {
        success: true,
        message: "삭제할 게시글이 없습니다.",
        deletedCount: 0
      };
    }

    console.log(`${postsToDelete.length}개의 게시글을 완전 삭제 예정`);

    let deletedImagesCount = 0;
    let deletedAttachmentsCount = 0;

    // 3. 각 게시글의 이미지와 첨부파일 삭제
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

    // 4. 관련 댓글들 완전 삭제
    const postIds = postsToDelete.map(p => p.id);
    
    const { error: commentsDeleteError } = await supabase
      .from('comments')
      .delete()
      .in('post_id', postIds);

    if (commentsDeleteError) {
      console.error("댓글 삭제 실패:", commentsDeleteError);
    }

    // 5. 게시글들 완전 삭제
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

    return {
      success: true,
      message: "게시글 정리가 완료되었습니다.",
      deletedCount: postsToDelete.length,
      deletedImages: deletedImagesCount,
      deletedAttachments: deletedAttachmentsCount
    };

  } catch (error: any) {
    console.error('게시글 정리 오류:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다.'
    });
  }
});