# hit-secret 프로젝트 정보

## 프로젝트 개요

**hit-secret**은 완전한 익명성을 보장하는 사내 게시판 시스템입니다.

### 핵심 특징
- **완전한 익명성**: IP 주소 미저장, 사용자 테이블 없음, 로그에서 개인정보 제거
- **기술 스택**: Nuxt.js 4 + Vue 3 + TypeScript + Supabase + Tailwind CSS
- **익명 아키텍처**: 닉네임 + 비밀번호 기반 소유권, 세션 추적 없음

## 데이터베이스 구조

### 주요 테이블
1. **posts** - 게시글 (익명성 보장)
   - 닉네임 기반 식별, 비밀번호 해싱, IP 미저장
   - view_count, like_count, comment_count 통계

2. **comments** - 계층형 댓글 시스템
   - 10레벨 깊이 제한, 대댓글 지원
   - is_author 플래그로 게시글 작성자 구분

3. **attachments** - 파일 첨부
   - 이미지/문서 지원, 메타데이터만 저장

### 관계도
```
posts 1:many comments (post_id)
posts 1:many attachments (post_id)
comments self-reference (parent_id)
```

## 익명성 보장 방식

### 데이터베이스 레벨
- 사용자 테이블 없음
- IP 주소 저장 안함
- 닉네임만으로 식별

### 애플리케이션 레벨
- 로그에서 hostname, pid 제거
- 세션 추적 없음
- 개인정보 필터링

### 보안 기능
- bcrypt 비밀번호 해싱
- XSS 방지 입력 무해화
- 파일 업로드 보안

## 현재 기능 상태

### 완료된 기능
- 익명 게시글 작성/수정/삭제
- 계층형 댓글 시스템
- 좋아요 기능
- 파일 첨부
- 리치 텍스트 에디터
- 검색 기능
- 소프트 삭제
- 반응형 디자인

### 개발 설정
- 댓글 없는 게시글은 목록에서 제외
- 삭제된 게시글의 댓글도 조회 가능
- 익명 로깅 시스템 적용

## 프로젝트 구조

```
hit-secret/
├── components/          # Vue 컴포넌트
│   ├── Post/           # 게시글 관련
│   ├── Comment*/       # 댓글 관련
│   ├── Sidebar/        # 사이드바 위젯
│   └── ui/            # UI 컴포넌트
├── pages/              # 페이지 (파일 기반 라우팅)
├── server/             # 서버 사이드
│   ├── api/           # API 엔드포인트
│   └── middleware/    # 서버 미들웨어
├── composables/        # Vue 컴포저블
├── utils/             # 유틸리티 (logger 등)
└── supabase/          # DB 스키마/마이그레이션
```

## 환경 설정

### 필수 환경변수
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 익명 키  
- `SITE_PASSWORD`: 사이트 접근 비밀번호

### 개발 환경
- Node.js 18+
- Nuxt.js 4
- Supabase (PostgreSQL)

## 작업 가이드라인

### 익명성 유지 원칙
1. 개인 식별 정보 절대 저장 금지
2. 로그에서 식별 가능한 정보 제거
3. 세션이나 쿠키 기반 추적 금지
4. 닉네임 + 비밀번호만으로 소유권 확인

### 코딩 컨벤션
- TypeScript 엄격 모드 사용
- Vue 3 Composition API 사용
- Tailwind CSS 유틸리티 클래스
- ESLint 규칙 준수

### 데이터베이스 작업시 주의사항
- IP 주소 절대 저장 금지
- 사용자 식별 컬럼 추가 금지
- 로그 테이블에도 익명성 보장

## 테스트 정보

### 테스트 도구
- Vitest (단위 테스트)
- Playwright (E2E 테스트)
- 테스트 데이터: 108개 게시글, 578개 댓글

### 테스트 명령어
- `npm run test` - 단위 테스트
- `npm run test:e2e` - E2E 테스트
- `npm run test:ui` - 테스트 UI

## Supabase 정보

### 접근 방법
- 데이터베이스 스키마 검토 가능
- 라이브 DB 접근 요청시 연결 정보 제공
- MCP Supabase 서버를 통한 스키마 조회 가능

### 주요 설정
- RLS 비활성화 (익명 게시판 특성상)
- UUID 기본키 사용
- 자동 타임스탬프
- 체크 제약조건으로 데이터 검증

## 향후 개발 참고사항

### 새 기능 추가시
1. 익명성 원칙 준수 확인
2. 기존 아키텍처와 일관성 유지
3. 개인정보 로깅 방지
4. 보안 검토 필수

### 성능 최적화
- 게시글 목록: 댓글 있는 것만 조회
- 페이지네이션: 커서 기반 무한 스크롤
- 파일 업로드: 이미지 압축 및 최적화

### 보안 고려사항
- XSS 공격 방지
- CSRF 토큰 사용
- 파일 업로드 검증
- 속도 제한 구현

이 문서는 hit-secret 프로젝트의 지속적인 개발과 유지보수를 위한 핵심 정보를 담고 있습니다.

---

# 상세 개발자 가이드

## API 완전 문서

### 인증

모든 API 요청은 헤더에 `X-API-Key`를 포함해야 합니다.

```javascript
headers: {
  'X-API-Key': process.env.SERVER_API_KEY,
  'Content-Type': 'application/json'
}
```

### 게시글 API

#### GET `/api/posts` - 게시글 목록 조회

**쿼리 파라미터:**
- `page` (number, optional): 페이지 번호 (기본값: 1)
- `limit` (number, optional): 페이지당 개수 (기본값: 20, 최대: 50)
- `sort` (string, optional): 정렬 기준 (`created`, `activity`, `likes`, `views`, `comments`)
- `search` (string, optional): 검색어
- `cursor` (string, optional): 커서 기반 페이지네이션

**응답 예제:**
```json
{
  "success": true,
  "data": {
    "posts": [{
      "id": "uuid",
      "title": "게시글 제목",
      "content": "<p>HTML 내용</p>",
      "nickname": "작성자",
      "preview": "텍스트 미리보기...",
      "view_count": 10,
      "like_count": 5,
      "comment_count": 3,
      "hasAttachments": true,
      "is_deleted": false,
      "created_at": "2025-01-15T10:30:00Z"
    }],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalCount": 200,
      "hasMore": true
    }
  }
}
```

#### POST `/api/posts` - 게시글 작성

**요청 바디:**
```json
{
  "title": "게시글 제목 (5-255자)",
  "content": "<p>HTML 형식의 내용 (10-50000자)</p>",
  "nickname": "닉네임 (1-10자, 한글/영문/숫자)",
  "password": "비밀번호 (4-20자)",
  "attachedFiles": [{
    "filename": "image.jpg",
    "url": "https://supabase.co/image.jpg",
    "size": 12345
  }]
}
```

#### POST `/api/posts/[id]/verify` - 게시글 비밀번호 확인

**요청 바디:**
```json
{
  "password": "비밀번호"
}
```

**응답:**
```json
{
  "success": true,
  "valid": true
}
```

### 댓글 API

#### GET `/api/comments/[postId]` - 댓글 목록 조회

**응답 예제:**
```json
{
  "success": true,
  "data": {
    "comments": [{
      "id": "uuid",
      "post_id": "uuid",
      "parent_id": null,
      "content": "댓글 내용",
      "nickname": "댓글러",
      "depth": 0,
      "like_count": 2,
      "is_author": false,
      "is_deleted": false,
      "created_at": "2025-01-15T11:00:00Z",
      "replies": [{
        "id": "uuid2",
        "parent_id": "uuid",
        "content": "대댓글 내용",
        "nickname": "답글러",
        "depth": 1,
        "is_author": true,
        "created_at": "2025-01-15T11:30:00Z"
      }]
    }],
    "total_count": 10
  }
}
```

#### POST `/api/comments` - 댓글 작성

**요청 바디:**
```json
{
  "postId": "uuid",
  "parentId": "uuid (대댓글인 경우)",
  "content": "댓글 내용 (1-1000자)",
  "nickname": "닉네임 (1-10자)",
  "password": "비밀번호",
  "isAuthor": true
}
```

### 파일 업로드 API

#### POST `/api/upload/image` - 이미지 업로드

**요청:** `multipart/form-data`
- 지원 형식: JPG, PNG, GIF, WebP
- 최대 크기: 10MB

**응답 예제:**
```json
{
  "success": true,
  "data": {
    "filename": "image_1705334400_abc123.jpg",
    "url": "https://supabase.co/storage/.../image.jpg",
    "size": 12345,
    "path": "2025/01/15/image_1705334400_abc123.jpg"
  }
}
```

## 보안 구현 세부사항

### 비밀번호 보안

**bcrypt 해싱:**
```typescript
import bcrypt from 'bcryptjs'

// 해싱 (Salt rounds: 10)
const passwordHash = await bcrypt.hash(password, 10)

// 검증
const isValid = await bcrypt.compare(inputPassword, storedHash)
```

### XSS 방지

**HTML 콘텐츠 정리:**
```typescript
function sanitizeHtml(html: string): string {
  let cleaned = html
  
  // 위험한 태그 제거
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // 이벤트 핸들러 제거
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // javascript: URL 제거
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
  
  return cleaned
}
```

### 입력 검증

**Zod 스키마 검증:**
```typescript
const createPostSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(10).max(50000),
  nickname: z.string().min(1).max(10)
    .regex(/^[가-힣a-zA-Z0-9\s]+$/, "한글, 영문, 숫자만 허용"),
  password: z.string().min(4).max(20)
})
```

### 파일 업로드 보안

**안전한 파일 처리:**
```typescript
// 파일 검증
if (!file.type?.startsWith('image/')) {
  throw createError({ statusCode: 400, statusMessage: '이미지 파일만 허용' })
}

if (file.data.length > 10 * 1024 * 1024) {
  throw createError({ statusCode: 400, statusMessage: '10MB 이하만 허용' })
}

// 안전한 파일명 생성
const timestamp = Date.now()
const random = Math.random().toString(36).substring(2, 8)
const filename = `image_${timestamp}_${random}.${ext}`
```

## 환경 설정 완전 가이드

### 필수 환경 변수

**`.env` 파일 설정:**
```bash
# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# API 보안
SERVER_API_KEY=your-api-key

# 사이트 비밀번호 (선택사항)
SITE_PASSWORD=your-site-password

# 서버 설정
NODE_ENV=development
PORT=3000

# 로깅 설정
LOG_LEVEL=info

# 파일 업로드 설정
MAX_FILE_SIZE=10485760  # 10MB

# 성능 설정
CACHE_TTL=3600  # 1시간
```

### Supabase 프로젝트 설정

**1. Storage 버킷 생성:**
```sql
-- Storage > Buckets에서 새 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- 파일 업로드 정책
CREATE POLICY "Anyone can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');
```

**2. RLS 정책 설정:**
```sql
-- Posts 테이블 RLS 정책
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON posts
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert posts" ON posts
FOR INSERT WITH CHECK (true);

-- Comments 테이블 RLS 정책
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON comments
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert comments" ON comments
FOR INSERT WITH CHECK (true);
```

## 개발자 워크플로우

### 코딩 컨벤션

**TypeScript 규칙:**
- Strict mode 활성화
- 명시적 타입 선언
- Interface > Type 우선 사용

**Vue 컴포넌트 규칙:**
- Composition API 사용
- `<script setup>` 문법 사용
- Props는 TypeScript interface로 정의

**파일명 규칙:**
- 컴포넌트: PascalCase (`UserProfile.vue`)
- Composables: camelCase (`useComments.ts`)
- Pages: kebab-case (`user-profile.vue`)

### 브랜치 전략
```bash
main          # 프로덕션 코드
├── develop   # 개발 통합 브랜치
├── feature/  # 새 기능 개발
├── fix/      # 버그 수정
└── hotfix/   # 긴급 수정
```

### 커밋 메시지 규칙
```bash
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
style: 코드 포맷팅, 스타일 변경
docs: 문서 수정
test: 테스트 코드 추가/수정
chore: 빌드 프로세스 또는 도구 변경
```

## 성능 최적화

### 데이터베이스 최적화

**인덱스 최적화:**
```sql
-- 자주 사용되는 쿼리용 인덱스
CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX CONCURRENTLY idx_posts_comment_count ON posts(comment_count DESC) WHERE comment_count > 0;
CREATE INDEX CONCURRENTLY idx_posts_like_count ON posts(like_count DESC);

CREATE INDEX CONCURRENTLY idx_comments_post_id ON comments(post_id);
CREATE INDEX CONCURRENTLY idx_comments_created_at ON comments(created_at DESC);

-- 복합 인덱스
CREATE INDEX CONCURRENTLY idx_posts_active ON posts(comment_count, created_at DESC) 
WHERE comment_count > 0 AND is_deleted = false;
```

**쿼리 최적화:**
```sql
-- 효율적인 페이지네이션
SELECT id, title, nickname, view_count, like_count, comment_count, created_at
FROM posts 
WHERE comment_count > 0 
  AND created_at < $1 
ORDER BY created_at DESC, id DESC 
LIMIT 21;
```

### 프론트엔드 최적화

**코드 스플리팅:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  build: {
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true
    }
  }
})
```

**캐싱 전략:**
```typescript
// composables/useCache.ts
const cache = new Map()

export const useCache = () => {
  const get = <T>(key: string): T | null => {
    const item = cache.get(key)
    if (!item || Date.now() > item.expiry) {
      cache.delete(key)
      return null
    }
    return item.data
  }
  
  const set = <T>(key: string, data: T, ttl: number = 300000) => {
    cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }
  
  return { get, set }
}
```

## 트러블슈팅 가이드

### 일반적인 문제들

**1. 데이터베이스 연결 오류**
```bash
# 증상: "Connection refused" 또는 "Invalid JWT"
# 해결:
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Supabase 프로젝트 상태 확인
curl "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY"
```

**2. 파일 업로드 실패**
```bash
# 증상: "Upload failed" 또는 "File too large"
# 로그 확인
tail -f logs/error.log | grep upload

# 저장소 용량 확인
df -h
```

**3. 빌드 오류**
```bash
# 증상: TypeScript 컴파일 에러
# 해결: 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 로그 분석

**에러 로그 분석:**
```bash
# 에러 빈도 분석
grep "ERROR" logs/error.log | awk '{print $1 " " $2}' | uniq -c | sort -nr

# API 응답 시간 분석
grep "responseTime" logs/access.log | awk '{print $NF}' | sort -n | tail -10
```

**성능 모니터링:**
```bash
# CPU 사용률 모니터링
top -p $(pgrep -f "nuxt")

# 메모리 사용률 모니터링
ps aux | grep nuxt | grep -v grep | awk '{sum+=$6} END {print "Memory: " sum/1024 "MB"}'
```

## 배포 가이드

### Docker 컨테이너화

**Dockerfile:**
```dockerfile
# multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.output ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server/index.mjs"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

## 코드 예제

### 게시글 작성 예제

**TypeScript 클라이언트:**
```typescript
const createPost = async (postData: CreatePostData) => {
  try {
    const response = await $fetch('/api/posts', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.SERVER_API_KEY
      },
      body: {
        title: postData.title,
        content: postData.content,
        nickname: postData.nickname,
        password: postData.password,
        attachedFiles: postData.files
      }
    })
    
    if (response.success) {
      console.log('게시글 작성 성공:', response.data.id)
      return response.data
    }
  } catch (error) {
    console.error('게시글 작성 실패:', error)
    throw error
  }
}
```

### Vue 컴포넌트 예제

**댓글 작성 컴포넌트:**
```vue
<template>
  <div class="comment-system">
    <form @submit.prevent="submitComment">
      <textarea 
        v-model="comment.content" 
        placeholder="댓글을 입력하세요" 
        required
      />
      <input 
        v-model="comment.nickname" 
        placeholder="닉네임" 
        required
      />
      <input 
        v-model="comment.password" 
        type="password" 
        placeholder="비밀번호" 
        required
      />
      <button type="submit" :disabled="submitting">
        {{ submitting ? '작성 중...' : '댓글 작성' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
interface Props {
  postId: string
}

const props = defineProps<Props>()
const { createComment } = useComments(props.postId)

const comment = ref({
  content: '',
  nickname: '',
  password: ''
})

const submitting = ref(false)

const submitComment = async () => {
  submitting.value = true
  try {
    await createComment({
      postId: props.postId,
      content: comment.value.content,
      nickname: comment.value.nickname,
      password: comment.value.password
    })
    
    // 폼 초기화
    comment.value = { content: '', nickname: '', password: '' }
    alert('댓글이 작성되었습니다.')
  } catch (error) {
    alert('댓글 작성에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>
```

### Composable 예제

**게시글 관리 Composable:**
```typescript
// composables/usePosts.ts
export const usePosts = () => {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const fetchPosts = async (options: FetchOptions = {}) => {
    loading.value = true
    try {
      const response = await $fetch('/api/posts', {
        method: 'GET',
        headers: { 'X-API-Key': process.env.SERVER_API_KEY },
        query: {
          page: options.page || 1,
          limit: options.limit || 20,
          sort: options.sort || 'created',
          search: options.search || ''
        }
      })
      
      if (response.success) {
        posts.value = response.data.posts
      }
    } catch (err: any) {
      error.value = err.message || '게시글을 불러오지 못했습니다.'
    } finally {
      loading.value = false
    }
  }
  
  const createPost = async (postData: CreatePostData) => {
    const response = await $fetch('/api/posts', {
      method: 'POST',
      headers: { 'X-API-Key': process.env.SERVER_API_KEY },
      body: postData
    })
    
    if (response.success) {
      await fetchPosts({ page: 1 })
      return response.data
    }
  }
  
  return {
    posts: readonly(posts),
    loading: readonly(loading),
    error: readonly(error),
    fetchPosts,
    createPost
  }
}
```

이 상세한 개발자 가이드는 hit-secret 프로젝트의 모든 기술적 세부사항을 다루며, 새로운 개발자가 프로젝트에 효과적으로 기여할 수 있도록 도와줍니다.