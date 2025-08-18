/**
 * @description 게시글 삭제 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 * 소프트 삭제를 수행하며, 게시글 내용과 첨부파일 정보를 제거하고 스토리지의 파일들도 삭제합니다.
 */
import { z } from "zod";
import { 
  validateUUIDOrThrow,
  createSuccessResponse,
  CommonErrors,
  getSupabaseClient,
  findPostById,
  comparePassword,
  createApiHandler
} from '~/server/utils';
import { extractImagePathsFromHtml } from '~/utils/imageUtils';

const deletePostSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요")
});

export default createApiHandler(async (event) => {
  // 1. 라우터 파라미터에서 게시글 ID 추출 및 검증
  const postId = getRouterParam(event, 'id');
  validateUUIDOrThrow(postId, '게시글 ID');

  // 2. 요청 본문 검증
  const body = await readBody(event);
  const { password } = deletePostSchema.parse(body);

  // 3. 게시글 조회
  const supabase = await getSupabaseClient(event);
  const post = await findPostById(supabase, postId!, false); // 삭제된 게시글 제외

  if (!post) {
    throw CommonErrors.NotFound.Post();
  }

  // 4. 비밀번호 검증
  const isValidPassword = await comparePassword(password, post.password_hash);
  if (!isValidPassword) {
    throw CommonErrors.Unauthorized.InvalidPassword();
  }

  // 5. 게시글 내 이미지 파일 경로 추출 및 삭제
  const imagePaths = extractImagePathsFromHtml(post.content);
  const attachedFiles = (post as any)?.attached_files || [];
  
  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('post-images')
      .remove(imagePaths);
    if (storageError) {
      console.error('이미지 삭제 중 오류:', storageError);
    }
  }

  // 6. 첨부파일 삭제
  if (attachedFiles.length > 0) {
    for (const attachedFile of attachedFiles) {
      try {
        const urlParts = attachedFile.url.split('/storage/v1/object/public/attachments/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          const { error: deleteError } = await supabase.storage
            .from('attachments')
            .remove([filePath]);
          if (deleteError) {
            console.error(`첨부파일 삭제 실패: ${filePath}`, deleteError);
          }
        }
      } catch (deleteErr) {
        console.error("첨부파일 삭제 중 오류:", deleteErr);
      }
    }
  }

  // 7. 게시글 소프트 삭제 처리
  const { error: deleteError } = await supabase
    .from('posts')
    .update({
      title: '삭제된 게시글입니다',
      content: '<p>삭제된 게시글입니다.</p>',
      attached_files: null,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      has_attachments: false,
      attachment_count: 0
    })
    .eq('id', postId);

  if (deleteError) {
    console.error('게시글 삭제 실패:', deleteError);
    throw createError({
      statusCode: 500,
      statusMessage: '게시글 삭제에 실패했습니다.'
    });
  }

  // 8. 성공 응답
  return createSuccessResponse({
    deleted: true,
    deletedImages: imagePaths.length,
    deletedAttachments: attachedFiles.length
  }, '게시글이 삭제되었습니다.');

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '게시글 삭제 중 오류가 발생했습니다.'
});