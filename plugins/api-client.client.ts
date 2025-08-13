// plugins/api-client.client.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const serverApiKey = config.public.serverApiKey;

  // 기존 $fetch를 오버라이드
  const originalFetch = $fetch;
  
  globalThis.$fetch = ((url: any, options: any = {}) => {
    // API 경로인 경우 x-api-key 헤더 추가
    if (typeof url === 'string' && url.includes('/api/')) {
      options.headers = {
        ...options.headers,
        'x-api-key': serverApiKey
      } as any;
    }
    
    return originalFetch(url, options);
  }) as any;

  // useFetch, useLazyFetch 등도 자동으로 적용됨 (내부적으로 $fetch 사용)
  
  // 수동으로 사용할 수 있는 API 클라이언트 제공 - 함수 형태로 제공
  const createApiClient = (baseURL?: string) => {
    return (url: string, options: any = {}) => {
      const fullUrl = baseURL ? `${baseURL}${url}` : url;
      return $fetch(fullUrl, {
        ...options,
        headers: {
          ...options.headers,
          'x-api-key': serverApiKey
        }
      });
    };
  };

  return {
    provide: {
      apiClient: createApiClient()
    }
  };
});