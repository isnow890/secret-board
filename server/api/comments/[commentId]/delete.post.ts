/**
 * @description 댓글 삭제 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 */
import { z } from "zod";
import { 
  validateUUIDOrThrow,
  createSuccessResponse,
  CommonErrors,
  getSupabaseClient,
  findCommentById,
  comparePassword,
  createApiHandler
} from '~/server/utils';

const deleteCommentSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export default createApiHandler(async (event) => {
  // 1. 라우터 파라미터에서 댓글 ID 추출 및 검증
  const commentId = getRouterParam(event, "commentId");
  validateUUIDOrThrow(commentId, '댓글 ID');

  // 2. 요청 본문 검증
  const body = await readBody(event);
  const { password } = deleteCommentSchema.parse(body);

  // 3. 댓글 조회
  const supabase = await getSupabaseClient(event);
  const comment = await findCommentById(supabase, commentId!, false); // 삭제된 댓글 제외

  if (!comment) {
    throw CommonErrors.NotFound.Comment();
  }

  // 4. 비밀번호 검증
  const isPasswordValid = await comparePassword(password, comment.password_hash);
  if (!isPasswordValid) {
    throw CommonErrors.Unauthorized.InvalidPassword();
  }

  // 5. Soft Delete 처리
  const { error: updateError } = await supabase
    .from("comments")
    .update({
      content: "삭제된 댓글입니다.",
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (updateError) {
    console.error("Comment soft delete error:", updateError);
    throw createError({
      statusCode: 500,
      statusMessage: "댓글 삭제 중 오류가 발생했습니다.",
    });
  }

  // 6. 성공 응답
  return createSuccessResponse({
    deleted: true,
    soft_deleted: true,
    comment_id: commentId,
  }, "댓글이 삭제되었습니다.");

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '댓글 삭제 중 오류가 발생했습니다.'
});