# 서버 라우트 리팩토링 제안서

본 문서는 서버 라우트 코드의 중복 검증/보일러플레이트 제거와 일관성 강화를 위한 구조/패턴 제안을 담습니다. 실제 코드 수정 없이, 재사용 가능한 구성요소와 폴더 구조/마이그레이션 순서를 구체화합니다.

---

## 목표
- 중복 제거: 유효성 검증, 에러 처리, 응답 포맷, 로깅, UUID/메서드 체크 등 반복 로직 제거
- 일관성: 모든 라우트에서 동일한 요청/응답 규약, 에러 매핑, 로깅 필드 사용
- 관심사 분리: 라우트(HTTP) ↔ 컨트롤러(입출력) ↔ 서비스(도메인) ↔ 리포지토리(DB)
- 테스트 용이성: 서비스/리포지토리 유닛테스트 가능, Zod 스키마 스냅샷 테스트
- 보안/안전성: 입력 정규화/클린업, 서버사이드 sanitize, 공통 레이트리밋/키 검증 미들웨어

---

## 현재 관찰된 문제점 요약
- 검증 중복
  - 일부 라우트는 Zod 사용(z.string().uuid 등), 일부는 수동 정규식(UUID 검사) 사용
  - 닉네임/비밀번호 등 동일 제약이 여러 파일에 반복 정의
- 보일러플레이트 반복
  - try/catch, 응답 래핑({ success, data, timestamp }) 패턴이 파일마다 반복
  - setHeader("Content-Type", ...), 405 메서드 가드(파일명에 http 메서드가 이미 명시됨) 등 중복
- 에러 처리/로깅 불일치
  - 에러 로깅/응답 메시지/상태코드 매핑 규칙이 라우트마다 상이
  - 일부 라우트만 구조화 로깅(util/logger), 일부는 console.error
- 유틸이 라우트 내부에 존재
  - sanitizeHtml 함수가 라우트 파일 내부에 존재하여 재사용/테스트가 어려움
- 비동기 부작용 처리 위치 혼재
  - AI 요약 백그라운드 실행 로직이 라우트에 내장되어 관심사 혼재

---

## 제안 폴더 구조
Nuxt server 디렉터리 기준, 라우트는 최대한 얇게 유지하고 도메인 계층을 분리합니다.

```
server/
  api/                    # 파일 기반 라우트(얇게 유지). 컨트롤러 호출만 수행
    posts/
      index.get.ts
      index.post.ts
      [id].get.ts
      [id].delete.ts
      ...
    comments/
      index.post.ts
      ...
    ...

  domains/                # 도메인 계층 (컨트롤러/서비스/리포지토리/스키마)
    posts/
      posts.controller.ts  # HTTP 입출력 ↔ 서비스 변환, DTO 매핑
      posts.service.ts     # 비즈니스 규칙/유스케이스, 트랜잭션 경계
      posts.repository.ts  # Supabase 접근(SELECT/INSERT/UPDATE), 컬럼 프로젝션 고정화
      posts.schemas.ts     # Zod 스키마(입력 DTO/쿼리/파라미터)
    comments/
      comments.controller.ts
      comments.service.ts
      comments.repository.ts
      comments.schemas.ts
    shared/
      shared.schemas.ts    # 닉네임/비밀번호/페이징/정렬 공통 스키마

  middleware/             # h3 미들웨어/데코레이터
    validateApiKey.ts     # (현존) 키 검증
    rateLimit.ts          # (선택) 레이트 리미팅
    withValidated.ts      # Zod 검증/정규화 공통 래퍼
    withErrorHandling.ts  # 에러 매핑/응답 통일

  utils/
    sanitizer.ts          # 서버사이드 sanitize(라이브러리 래핑)
    pagination.ts         # 커서/페이지 공통 계산, nextCursor 생성 규약
    response.ts           # ApiResponse 헬퍼(jsonOk/jsonCreated/jsonError)
    logging.ts            # 일관 로그 포맷(logApiCall/logError)

  errors/
    appError.ts           # AppError(코드/메시지/httpStatus), 에러 변환 테이블

  types/
    http.ts               # ApiResponse<T>, PagingMeta 등 공용 타입
```

---

## 공통 유틸/미들웨어 설계

### 1) 입력 검증/정규화 래퍼
- 목적: 라우트에서 Zod 검증/파싱/trim/safeParse 분기를 제거
- withValidated.ts (예시 인터페이스)
  - withValidatedBody(schema)
  - withValidatedQuery(schema)
  - withValidatedParams(schema)
  - compose(...middlewares, handler)
- 특징
  - 성공 시 event.context에 body/query/params 를 타입 세이프하게 주입
  - 실패 시 400으로 AppError 변환

### 2) 에러 처리 일원화
- withErrorHandling(handler):
  - try/catch 공통화, ZodError→400, Supabase(PostgREST) 에러 코드 매핑, 기본 500
  - 모든 응답에 동일한 포맷과 UTF-8 헤더 설정
- errors/appError.ts:
  - class AppError extends Error { code, status, expose }
  - fromZodError, fromSupabaseError, unknownToAppError 변환기

### 3) 응답 헬퍼
- utils/response.ts:
  - jsonOk(data, meta?)
  - jsonCreated(data)
  - jsonNoContent()
  - jsonError(appError)
- 공통 envelope: `{ success: boolean, data?: T, error?: { code, message }, meta?: any, timestamp }`

### 4) 로깅/관찰성
- utils/logging.ts:
  - logApiCall(method, path, status, durationMs, extra?)
  - logError(err, context)
- 요청 단위 correlationId 생성(헤더 X-Request-Id 수용 또는 생성) → event.context에 저장

### 5) 서버사이드 sanitize
- utils/sanitizer.ts로 이동하여 라이브러리 래핑 권장
  - 선택지: `sanitize-html`, `isomorphic-dompurify`(SSR 호환 확인)
  - 정책: 허용 태그/속성 화이트리스트, on* 제거, javascript: 제거 등 공통 규칙

### 6) 페이징/정렬/커서 규약 통일
- utils/pagination.ts:
  - validateAndBuildPageParams(limit<=50), buildCursor(sort, lastRow)
  - nextCursor 규약: `${sortKey}|${id}` 패턴 통일
  - 페이지/커서 혼용 시 메타 구조 고정: `{ currentPage, totalPages, totalCount, hasMore, nextCursor, currentSort, searchQuery }`

---

## 라우트 파일 두께 가이드
- 라우트 파일(server/api/*)에서는 아래만 수행
  1) 미들웨어 합성(withErrorHandling, validateApiKey(선택), withValidated*)
  2) 컨트롤러 메서드 호출
  3) 결과를 jsonOk/Created로 반환
- 비즈니스 로직/쿼리는 컨트롤러 이하 계층으로 이동

---

## 도메인 계층 역할 분담
- Controller: HTTP ↔ DTO 변환, 서비스 호출, 헤더/상태코드 결정
- Service: 유스케이스 구현(검증 이후 규칙, 권한, 부작용 트리거)
- Repository: Supabase 질의 캡슐화(선택 컬럼/필터/정렬 고정화, 중복 제거)
- Schemas: Zod 스키마/입력 정규화(공통 제약 상수 공유)

---

## 공통 스키마(예)
- shared.schemas.ts
  - `Nickname = z.string().min(1).max(15).regex(/^[가-힣a-zA-Z0-9\s]+$/)`
  - `FourDigitPassword = z.string().length(4).regex(/^[0-9]{4}$/)`
  - `Uuid = z.string().uuid()`
  - `PageQuery = z.object({ page: z.number().int().min(1).optional(), limit: z.number().int().min(1).max(50).default(20), sort: z.enum(["created","activity","likes","views","comments"]).default("created"), search: z.string().max(100).optional() })`
- posts.schemas.ts
  - `CreatePostBody`, `ListPostsQuery`, `GetPostParams({ id: Uuid })`
- comments.schemas.ts
  - `CreateCommentBody`

---

## 일관 응답 포맷 예
- 성공: `{ success: true, data, meta?, timestamp }`
- 실패: `{ success: false, error: { code, message }, timestamp }`
- 모든 라우트에서 `Content-Type: application/json; charset=utf-8` 고정

---

## 중복 제거 체크리스트
- [ ] 모든 UUID 검증을 `z.string().uuid()`로 통일 (수동 정규식 제거)
- [ ] 메서드 가드(405) 제거: 파일명으로 HTTP 메서드 분기됨
- [ ] try/catch 제거: withErrorHandling로 상단 래핑
- [ ] 응답 래핑 통일: response 헬퍼 사용
- [ ] sanitizeHtml 라우트 내 정의 제거 → utils/sanitizer.ts 재사용
- [ ] 로깅 통일: utils/logging.ts 사용 + correlationId
- [ ] API 키 검증 적용 기준 명확화: 변경성 있는 라우트에만 적용
- [ ] 페이징/커서/정렬 생성 로직 utils/pagination.ts로 이동

---

## 서비스 경계에서의 부작용 처리
- AI 요약 생성처럼 시간이 걸리는 작업은 Service에서 큐(또는 fire-and-forget) 트리거
  - posts.service.ts → `generateAiSummary(post)` 호출
  - 실패는 로깅만, 요청 응답 경로에는 영향 없음
  - 자격 증명(Supabase URL/Key, AI Key)은 구성/주입으로 캡슐화

---

## 마이그레이션 순서(점진적, 안전)
1) 공통 헬퍼 추가
   - utils/{response,logging,pagination,sanitizer}.ts
   - errors/appError.ts, middleware/withErrorHandling.ts
   - middleware/withValidated.ts (body/query/params)
2) 공통 스키마 도입
   - domains/shared/shared.schemas.ts에 공통 제약 상수 정의
3) 도메인 분리 시작
   - domains/posts/* 생성, posts 라우트 1~2개를 샘플 리팩토링
   - 컨트롤러/서비스/리포지토리 단위 테스트 추가
4) 댓글 도메인 적용
   - domains/comments/*로 이전, 반복 제약 제거
5) 잔여 라우트 적용
   - admin/ai/log/stats/upload 등 동일 패턴으로 전파
6) 라우트 내부 유틸 제거
   - sanitizeHtml 등 내장 유틸 제거, 공통 모듈 사용하도록 전환
7) 일관 로깅/응답 검증 및 문서화
   - 통합 스냅샷 테스트로 응답 envelope/메타 고정 검증

---

## 테스트 전략
- 단위: 서비스/리포지토리 함수(비즈니스 규칙/쿼리 결과) + Zod 스키마 파싱
- 통합: 라우트 핸들러(미들웨어 합성 후 200/400/404/500 경로)
- 회귀: 커서/페이지네이션 메타 생성 규약 스냅샷
- 퍼포먼스: 목록/카운트 쿼리 응답시간 로깅 임계값(예: 300ms 경고)

---

## 운영/안전 고려사항
- 레이트 리미팅: 변형/쓰기 라우트에만 적용(예: token bucket)
- 입력 정규화: `trim()`/공백 압축/이모지 허용 범위 등 정책 확정
- CORS/헤더: 민감 정보 노출 차단, 캐시 정책 명확화
- 환경변수: 서비스 계층에서만 접근, 라우트/컨트롤러는 의존성 주입

---

## 적용 예(개념)
아래는 개념적 예시이며, 실제 수정은 추후 단계별 리팩토링에서 진행합니다.

```ts
// middleware/withValidated.ts (개념)
export const withValidatedBody = <T>(schema: ZodSchema<T>) =>
  defineEventHandler(async (event) => {
    const parsed = schema.parse(await readBody(event));
    // @ts-expect-error context 주입
    event.context.body = parsed;
  });

export const compose = (...fns: EventHandler[]) => (handler: EventHandler) =>
  defineEventHandler((event) => fns.reduce((acc, fn) => acc.then(() => fn(event)), Promise.resolve()).then(() => handler(event)));
```

```ts
// utils/response.ts (개념)
export const jsonOk = <T>(event: H3Event, data: T, meta?: any) => ({ success: true, data, meta, timestamp: new Date().toISOString() });
```

---

## 기대 효과
- 라우트 파일 50%+ 경량화, 유지보수성 향상
- 검증/에러/응답/로깅 표준화로 버그율 감소 및 디버깅 시간 단축
- 테스트 범위 확대와 리팩토링 안전성 증가

---

## 다음 단계 제안
- 위 "마이그레이션 순서" 1~3단계까지를 한 PR로 진행(샘플: posts.create, posts.list)
- 합의된 응답/로깅/스키마 규약을 README 또는 ADR로 고정
- 이후 도메인별 점진 전파
