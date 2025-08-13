// server/api/posts/[id]/verify.post.ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from '~/types/supabase';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withApiKeyValidation } from '~/server/utils/apiKeyValidation';

const verifySchema = z.object({
  password: z.string().min(4).max(4)
});

export default withApiKeyValidation(async (event) => {
  try {
    const postId = getRouterParam(event, 'id');
    
    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: '게시글 ID가 필요합니다.'
      });
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바르지 않은 게시글 ID입니다.'
      });
    }
    
    // 요청 본문 파싱 및 검증
    const body = await readBody(event);
    const result = verifySchema.safeParse(body);
    
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바른 비밀번호를 입력해주세요.'
      });
    }
    
    const { password } = result.data;
    
    const supabase = await serverSupabaseClient<Database>(event);
    
    // 게시글 조회 (비밀번호 해시 포함)
    const { data: post, error } = await supabase
      .from('posts')
      .select('id, password_hash')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();
    
    if (error || !post) {
      throw createError({
        statusCode: 404,
        statusMessage: '게시글을 찾을 수 없습니다.'
      });
    }
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, post.password_hash);
    
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: '비밀번호가 일치하지 않습니다.'
      });
    }
    
    // 성공 응답
    return {
      success: true,
      message: '비밀번호가 확인되었습니다.'
    };
    
  } catch (error: any) {
    console.error('Password verification error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '서버 오류가 발생했습니다.'
    });
  }
});