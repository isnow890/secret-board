/**
 * @description 이미지 업로드 API (리팩토링 완료)
 * 새로운 유틸리티 함수들을 사용하여 중복 코드를 제거하고 통합된 파일 업로드 시스템을 구축했습니다.
 */
import { 
  createSuccessResponse,
  getSupabaseClient,
  uploadImage,
  createApiHandler
} from '~/server/utils';

export default createApiHandler(async (event) => {
  // 1. 멀티파트 폼 데이터 읽기
  const formData = await readMultipartFormData(event);
  
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '파일이 업로드되지 않았습니다.'
    });
  }

  const file = formData[0];
  
  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: '파일이 없습니다.'
    });
  }

  // 2. 이미지 파일 업로드 처리
  const supabase = await getSupabaseClient(event);
  const uploadResult = await uploadImage(supabase, file);

  // 3. 성공 응답 반환
  return createSuccessResponse({
    ...uploadResult,
    uploadType: 'image'
  }, '이미지 업로드가 완료되었습니다.');

}, {
  method: 'POST',
  requireAuth: true,
  customErrorMessage: '이미지 업로드 중 오류가 발생했습니다.'
});