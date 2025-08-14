/**
 * @description 새 댓글을 생성하는 API 엔드포인트입니다.
 * Zod를 사용한 유효성 검사, 비밀번호 해싱, 계층형 댓글 깊이 관리, 글쓴이 검증을 수행합니다.
 * @see /api/comments
 * @method POST
 * @param {object} event - H3 이벤트 객체
 * @returns {Promise<object>} 생성된 댓글 정보를 포함하는 응답 객체
 * @throws {400} 유효하지 않은 요청 데이터, 댓글 깊이 초과 시
 * @throws {401} 글쓴이 비밀번호가 틀린 경우
 * @throws {404} 게시글 또는 부모 댓글을 찾을 수 없는 경우
 * @throws {405} POST 메서드가 아닌 경우
 * @throws {500} 서버 오류 발생 시
 */
import bcrypt from "bcryptjs";
import { z } from "zod";
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { withApiKeyValidation } from "~/server/utils/apiKeyValidation";

/**
 * @description 댓글 생성을 위한 Zod 유효성 검사 스키마
 */
const CreateCommentSchema = z.object({
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

export default withApiKeyValidation(async (event) => {
  try {
    // POST 요청만 허용
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed",
      });
    }

    const body = await readBody(event);

    // 유효성 검사
    const validation = CreateCommentSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request data",
        data: validation.error.issues,
      });
    }

    const { postId, parentId, content, nickname, password, isAuthor } =
      validation.data;

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 10);

    // Supabase 클라이언트
    const supabase = await serverSupabaseClient<Database>(event);

    // 부모 댓글이 있는 경우 depth 검증
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
          statusMessage: "Parent comment not found",
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

    // 게시글 존재 확인 및 글쓴이 검증을 위한 정보 조회
    const { data: post } = await supabase
      .from("posts")
      .select("id, password_hash")
      .eq("id", postId)
      .single();

    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: "Post not found",
      });
    }

    // 글쓴이 여부 검증
    let verifiedAsAuthor = false;
    if (isAuthor) {
      verifiedAsAuthor = await bcrypt.compare(password, post.password_hash);

      // 글쓴이라고 주장했지만 비밀번호가 틀린 경우 에러 반환
      if (!verifiedAsAuthor) {
        throw createError({
          statusCode: 401,
          statusMessage: "글쓴이 비밀번호가 틀렸습니다.",
        });
      }
    }

    // 댓글 생성
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
        statusMessage: "Failed to create comment",
      });
    }

    return {
      success: true,
      data: comment,
    };
  } catch (error: any) {
    console.error("댓글 생성 API 에러:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
