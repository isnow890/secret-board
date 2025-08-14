/**
 * @description 댓글 수정 API (리팩토링 완료)
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

const editCommentSchema = z.object({
  content: z
    .string()
    .min(1, "댓글 내용을 입력해주세요.")
    .max(1000, "댓글은 1000자 이하로 작성해주세요."),
  password: z
    .string()
    .min(4, "비밀번호는 4자리이어야 합니다.")
    .max(100, "비밀번호가 너무 깁니다."),
});

export default createApiHandler(async (event) => {
  // 1. 라우터 파라미터에서 댓글 ID 추출 및 검증
  const commentId = getRouterParam(event, "commentId");
  validateUUIDOrThrow(commentId, '댓글 ID');

  // 2. 요청 본문 검증
  const body = await readBody(event);
  const validatedData = editCommentSchema.parse(body);

  // 3. 댓글 조회
  const supabase = await getSupabaseClient(event);
  const comment = await findCommentById(supabase, commentId!, false); // 삭제된 댓글 제외

  if (!comment) {
    throw CommonErrors.NotFound.Comment();
  }

  // 4. 삭제된 댓글인지 확인
  if (comment.is_deleted) {
    throw createError({
      statusCode: 400,
      statusMessage: "삭제된 댓글은 수정할 수 없습니다.",
    });
  }

  // 5. 비밀번호 검증
  const isValidPassword = await comparePassword(validatedData.password, comment.password_hash);
  if (!isValidPassword) {
    throw CommonErrors.Unauthorized.InvalidPassword();
  }

  // 6. 댓글 수정
  const { data: updatedComment, error: updateError } = await supabase
    .from("comments")
    .update({
      content: validatedData.content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .select("id, content, updated_at")
    .single();

  if (updateError) {
    console.error("댓글 수정 오류:", updateError);
    throw createError({
      statusCode: 500,
      statusMessage: "댓글 수정 중 오류가 발생했습니다.",
    });
  }

  // 7. 성공 응답
  return createSuccessResponse(updatedComment, "댓글이 수정되었습니다.");

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '댓글 수정 중 오류가 발생했습니다.'
});
