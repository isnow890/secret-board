// utils/imageUtils.ts
/**
 * HTML 콘텐츠에서 이미지 URL들을 추출
 */
export function extractImageUrls(htmlContent: string): string[] {
  const imageUrls: string[] = [];
  const imgRegex = /<img[^>]+src="([^"]+)"/gi;
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    // Supabase Storage URL인지 확인 (post-images 버킷)
    if (src && src.includes("/storage/v1/object/public/post-images/")) {
      imageUrls.push(src);
    }
  }

  return imageUrls;
}

/**
 * 이미지 URL에서 파일 경로 추출
 */
export function extractImagePath(imageUrl: string): string | null {
  const match = imageUrl.match(
    /\/storage\/v1\/object\/public\/post-images\/(.+)$/
  );
  return match?.[1] ?? null;
}

/**
 * 이미지 URL들을 파일 경로로 변환
 */
export function getImagePaths(imageUrls: string[]): string[] {
  return imageUrls
    .map((url) => extractImagePath(url))
    .filter((path): path is string => path !== null);
}

/**
 * HTML 콘텐츠에서 이미지 경로들을 추출
 */
export function extractImagePathsFromHtml(htmlContent: string): string[] {
  const imageUrls = extractImageUrls(htmlContent);
  return getImagePaths(imageUrls);
}
