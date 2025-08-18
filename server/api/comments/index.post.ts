/**
 * @description 댓글 작성 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 안전성을 향상시켰습니다.
 * 계층형 댓글 깊이 관리, 글쓴이 검증 등의 기능을 포함합니다.
 */
import { z } from "zod";
import { 
  validateUUIDOrThrow,
  createSuccessResponse,
  CommonErrors,
  getSupabaseClient,
  hashPassword,
  comparePassword,
  createApiHandler
} from '~/server/utils';

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(1).max(1000),
  nickname: z
    .string()
    .min(1, "닉네임을 입력해주세요")
    .max(15, "닉네임은 15자 이하여야 합니다")
    .regex(
      /^[가-힣a-zA-Z0-9\s]+$/,
      "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다"
    ),
  password: z.string().min(1),
  isAuthor: z.boolean().optional().default(false), // 글쓴이 여부 체크
});

export default createApiHandler(async (event) => {
  // 1. 요청 본문 검증
  const body = await readBody(event);
  const { postId, parentId, content, nickname, password, isAuthor } = createCommentSchema.parse(body);

  // 2. UUID 검증
  validateUUIDOrThrow(postId, '게시글 ID');
  if (parentId) {
    validateUUIDOrThrow(parentId, '부모 댓글 ID');
  }

  // 3. 비밀번호 해시화
  const passwordHash = await hashPassword(password);

  // 4. Supabase 클라이언트
  const supabase = await getSupabaseClient(event);

  // 5. 부모 댓글이 있는 경우 depth 검증
  let depth = 0;
  if (parentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("depth")
      .eq("id", parentId)
      .single();

    if (!parentComment) {
      throw createError({
        statusCode: 404,
        statusMessage: "부모 댓글을 찾을 수 없습니다.",
      });
    }

    depth = (parentComment.depth || 0) + 1;

    // 최대 깊이 제한 (성능과 UX를 위해 최대 10단계까지 허용)
    if (depth > 10) {
      throw createError({
        statusCode: 400,
        statusMessage: "댓글 깊이가 너무 깊습니다",
      });
    }
  }

  // 6. 게시글 존재 확인 및 글쓴이 검증을 위한 정보 조회
  const { data: post } = await supabase
    .from("posts")
    .select("id, password_hash")
    .eq("id", postId)
    .single();

  if (!post) {
    throw CommonErrors.NotFound.Post();
  }

  // 7. 글쓴이 여부 검증
  let verifiedAsAuthor = false;
  if (isAuthor) {
    verifiedAsAuthor = await comparePassword(password, post.password_hash);

    // 글쓴이라고 주장했지만 비밀번호가 틀린 경우 에러 반환
    if (!verifiedAsAuthor) {
      throw createError({
        statusCode: 401,
        statusMessage: "글쓴이 비밀번호가 틀렸습니다.",
      });
    }
  }

  // 8. 댓글 생성
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      parent_id: parentId || null,
      content,
      nickname: nickname.trim(),
      password_hash: passwordHash,
      depth,
      is_author: verifiedAsAuthor,
    })
    .select(
      `
      id,
      post_id,
      parent_id,
      content,
      nickname,
      password_hash,
      depth,
      like_count,
      reply_count,
      is_author,
      is_deleted,
      deleted_at,
      created_at,
      updated_at
    `
    )
    .single();

  if (error) {
    console.error("댓글 생성 에러:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "댓글 생성에 실패했습니다.",
    });
  }

  // 9. 성공 응답
  return createSuccessResponse(comment, "댓글이 작성되었습니다.");

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '댓글 작성 중 오류가 발생했습니다.'
});
