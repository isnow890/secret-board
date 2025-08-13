// server/utils/validation.ts
import { z } from 'zod';
import type { H3Event } from 'h3';
import { createError, getMethod, readBody } from 'h3';

/**
 * 공통 Validation 스키마들
 */
export const commonSchemas = {
  // UUID 검증
  uuid: z.string().uuid('올바르지 않은 ID 형식입니다'),
  
  // 닉네임 검증 (게시글, 댓글 공통)
  nickname: z
    .string()
    .min(1, '닉네임을 입력해주세요')
    .max(15, '닉네임은 15자 이하여야 합니다')
    .regex(
      /^[가-힣a-zA-Z0-9\s]+$/,
      '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다'
    ),
  
  // 4자리 숫자 비밀번호
  password: z
    .string()
    .length(4, '비밀번호는 4자리여야 합니다')
    .regex(/^[0-9]{4}$/, '비밀번호는 숫자만 입력 가능합니다'),
  
  // 게시글 제목
  title: z
    .string()
    .min(3, '제목은 3자 이상이어야 합니다')
    .max(255, '제목은 255자 이하여야 합니다'),
  
  // 게시글 내용
  content: z
    .string()
    .min(10, '내용은 10자 이상이어야 합니다')
    .max(50000, '내용이 너무 깁니다'),
  
  // 댓글 내용
  commentContent: z
    .string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(1000, '댓글은 1000자 이하여야 합니다'),
  
  // 첨부 파일
  attachedFiles: z
    .array(
      z.object({
        filename: z.string(),
        url: z.string().url(),
        size: z.number().positive(),
      })
    )
    .optional()
    .default([]),
};

/**
 * 게시글 생성 스키마
 */
export const createPostSchema = z.object({
  title: commonSchemas.title,
  content: commonSchemas.content,
  nickname: commonSchemas.nickname,
  password: commonSchemas.password,
  attachedFiles: commonSchemas.attachedFiles,
});

/**
 * 게시글 수정 스키마
 */
export const updatePostSchema = z.object({
  title: commonSchemas.title.optional(),
  content: commonSchemas.content.optional(),
  password: commonSchemas.password,
  attachedFiles: commonSchemas.attachedFiles,
});

/**
 * 댓글 생성 스키마
 */
export const createCommentSchema = z.object({
  postId: commonSchemas.uuid,
  parentId: commonSchemas.uuid.optional(),
  content: commonSchemas.commentContent,
  nickname: commonSchemas.nickname,
  password: commonSchemas.password,
  isAuthor: z.boolean().optional().default(false),
});

/**
 * 댓글 수정 스키마
 */
export const updateCommentSchema = z.object({
  content: commonSchemas.commentContent,
  password: commonSchemas.password,
});

/**
 * 비밀번호 확인 스키마
 */
export const verifyPasswordSchema = z.object({
  password: commonSchemas.password,
});

/**
 * UUID 매개변수 검증
 */
export const validateUuidParam = (paramValue: string | undefined, paramName: string = 'ID') => {
  if (!paramValue) {
    throw createError({
      statusCode: 400,
      statusMessage: `${paramName}가 필요합니다.`,
    });
  }
  
  const result = commonSchemas.uuid.safeParse(paramValue);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `올바르지 않은 ${paramName} 형식입니다.`,
    });
  }
  
  return result.data;
};

/**
 * HTTP 메서드 검증
 */
export const validateMethod = (event: H3Event, allowedMethods: string[]) => {
  const method = getMethod(event);
  if (!allowedMethods.includes(method)) {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }
  return method;
};

/**
 * 요청 바디 검증 및 파싱
 */
export const validateAndParseBody = async <T>(
  event: H3Event,
  schema: z.ZodSchema<T>
): Promise<T> => {
  try {
    const body = await readBody(event);
    const result = schema.safeParse(body);
    
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: result.error.issues,
      });
    }
    
    return result.data;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: '요청 데이터를 파싱할 수 없습니다.',
    });
  }
};

// 타입 익스포트
export type CreatePostData = z.infer<typeof createPostSchema>;
export type UpdatePostData = z.infer<typeof updatePostSchema>;
export type CreateCommentData = z.infer<typeof createCommentSchema>;
export type UpdateCommentData = z.infer<typeof updateCommentSchema>;
export type VerifyPasswordData = z.infer<typeof verifyPasswordSchema>;