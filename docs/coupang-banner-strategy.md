# 🛒 쿠팡 배너 최적 배치 전략 & 구현 계획

## 📍 추천 배너 위치 (효과 순)

### 🥇 **1순위 - 즉시 구현 추천**

**1. 사이드바 상단** (데스크톱 전용)
- 📱 위치: `components/sidebar/BoardStats.vue` 위
- 📏 크기: 300x250 (중형 직사각형)
- ⚡ 장점: 최고 가시성, 컨텐츠 방해 없음
- 🎯 예상 CTR: 높음

**2. 게시글 상세 본문 하단**
- 📱 위치: PostContent와 댓글 섹션 사이
- 📏 크기: 728x90 (리더보드) 또는 300x250
- ⚡ 장점: 콘텐츠 완독 후 자연스러운 노출
- 🎯 예상 CTR: 매우 높음

### 🥈 **2순위 - 성과 확인 후 추가**

**3. 메인 페이지 게시글 목록 중간**
- 📱 위치: 3-4번째 게시글 사이 (네이티브 광고 형태)
- 📏 크기: 게시글과 동일한 카드 형태
- ⚡ 장점: 자연스러운 피드 통합
- 🎯 예상 CTR: 중상

**4. 댓글 섹션 중간**
- 📱 위치: 5-6개 댓글마다 배너 삽입
- 📏 크기: 300x100 (모바일 친화적)
- ⚡ 장점: 댓글 읽는 중 자연스러운 노출
- 🎯 예상 CTR: 중

## 📱 반응형 전략

### 데스크톱 (≥1024px)
- 사이드바 활용한 대형 배너 (300x250)
- 복수 배너 동시 노출 가능
- 리더보드 배너 (728x90) 활용

### 태블릿 (768px~1023px) 
- 중형 배너 (300x250)
- 사이드바 배너는 유지
- 본문 하단 배너 크기 조정

### 모바일 (<768px)
- 소형 배너 (320x50, 300x100)
- 사이드바 배너 숨김
- 본문 하단 및 댓글 중간 위주

## 🛠 기술 구현 계획

### Phase 1: 기본 시스템 구축

#### 1. CoupangBanner.vue - 기본 배너 컴포넌트
```vue
<template>
  <div class="coupang-banner" :class="sizeClass">
    <iframe 
      :src="bannerUrl" 
      :width="width" 
      :height="height"
      frameborder="0" 
      scrolling="no"
      @load="onBannerLoad"
      @error="onBannerError"
    />
  </div>
</template>
```

**주요 기능:**
- 반응형 크기 조정
- 로딩 실패시 fallback
- 클릭 추적
- 쿠팡 파트너스 API 연동

#### 2. AdContainer.vue - 반응형 배너 래퍼
```vue
<template>
  <div class="ad-container" :class="containerClass">
    <div class="ad-label">광고</div>
    <CoupangBanner 
      :size="bannerSize" 
      :category="category"
      @click="trackClick"
      @impression="trackImpression"
    />
  </div>
</template>
```

**주요 기능:**
- 광고 표시 라벨
- 광고 차단 감지
- A/B 테스트 지원
- 성과 측정

#### 3. useAds.ts - 광고 관련 composable
```typescript
export const useAds = () => {
  const trackClick = (bannerId: string, position: string) => {
    // 클릭 추적 로직
  }
  
  const trackImpression = (bannerId: string, position: string) => {
    // 노출 추적 로직
  }
  
  const getOptimalBanner = (position: string, userContext: any) => {
    // 최적 배너 선택 로직
  }
  
  return { trackClick, trackImpression, getOptimalBanner }
}
```

### Phase 2: 핵심 위치 배치

#### 4. 사이드바 상단 배너 추가
**위치:** `components/sidebar/BoardStats.vue` 위
```vue
<!-- layouts/default.vue 또는 pages/index.vue -->
<div class="sidebar">
  <!-- 새로 추가 -->
  <AdContainer 
    position="sidebar-top" 
    size="medium-rectangle"
    class="mb-6 hidden lg:block"
  />
  
  <BoardStats />
  <RecentComments />
</div>
```

#### 5. 게시글 상세 본문 하단 배너
**위치:** `pages/post/[id]/index.vue`
```vue
<article>
  <PostHeader />
  <PostContent />
  
  <!-- 새로 추가 -->
  <AdContainer 
    position="post-bottom" 
    size="leaderboard"
    class="my-8"
  />
  
  <CommentList />
</article>
```

### Phase 3: 확장 배치 (성과 확인 후)

#### 6. 메인 페이지 게시글 목록 중간 배너
```vue
<!-- pages/index.vue -->
<div v-for="(post, index) in posts" :key="post.id">
  <PostItem :post="post" />
  
  <!-- 3-4번째마다 배너 삽입 -->
  <AdContainer 
    v-if="(index + 1) % 4 === 0"
    position="feed-inline" 
    size="native-ad"
    class="my-4"
  />
</div>
```

#### 7. 댓글 섹션 중간 배너
```vue
<!-- components/comments/CommentList.vue -->
<div v-for="(comment, index) in comments" :key="comment.id">
  <CommentItem :comment="comment" />
  
  <!-- 5-6개마다 배너 삽입 -->
  <AdContainer 
    v-if="(index + 1) % 6 === 0"
    position="comment-inline" 
    size="mobile-banner"
    class="my-3"
  />
</div>
```

## 📊 성과 측정 지표

### 핵심 KPI
- **CTR (Click Through Rate)**: 클릭률
- **CPM (Cost Per Mille)**: 1000회 노출당 수익
- **CPC (Cost Per Click)**: 클릭당 수익
- **총 수익**: 월간/일간 광고 수익

### 위치별 성과 추적
```typescript
interface BannerPerformance {
  position: string
  impressions: number
  clicks: number
  ctr: number
  revenue: number
  date: string
}
```

### A/B 테스트 요소
- 배너 크기 (300x250 vs 728x90)
- 배너 위치 (상단 vs 하단)
- 카테고리별 상품 (전자제품 vs 생활용품)
- 표시 빈도 (항상 vs 간헐적)

## 💡 추가 최적화 아이디어

### 지능형 배너 시스템
- **컨텍스트 분석**: 게시글 내용 기반 관련 상품 추천
- **시간대별 최적화**: 시간대에 따른 상품 카테고리 변경
- **사용자 행동 분석**: 클릭 패턴 기반 개인화

### 기술적 최적화
- **지연 로딩**: 뷰포트에 들어올 때만 배너 로드
- **캐싱**: 배너 이미지 및 데이터 캐싱
- **광고 차단 대응**: 배너 로딩 실패시 대체 컨텐츠
- **성능 모니터링**: 배너로 인한 페이지 속도 저하 방지

### 사용자 경험
- **네이티브 광고**: 게시글과 유사한 디자인으로 자연스러운 통합
- **관련성 높은 상품**: 게시판 특성에 맞는 상품 선별
- **비침습적 배치**: 사용자 경험을 해치지 않는 위치 선정

## 🚀 구현 일정 (예상)

### Week 1: 기본 시스템 구축
- [ ] CoupangBanner.vue 컴포넌트 개발
- [ ] AdContainer.vue 래퍼 개발  
- [ ] useAds.ts composable 개발
- [ ] 쿠팡 파트너스 API 연동

### Week 2: 핵심 위치 배치
- [ ] 사이드바 상단 배너 추가
- [ ] 게시글 상세 하단 배너 추가
- [ ] 반응형 디자인 적용
- [ ] 기본 성과 측정 시스템

### Week 3-4: 테스트 및 최적화
- [ ] 배너 성과 분석
- [ ] A/B 테스트 실행
- [ ] 사용자 피드백 수집
- [ ] 성능 최적화

### Week 5+: 확장 및 고도화
- [ ] 추가 위치 배치 (성과 기반)
- [ ] 지능형 배너 시스템 구축
- [ ] 고급 성과 분석 대시보드
- [ ] 자동 최적화 시스템

## 🎯 예상 효과

익명 게시판 특성상 다음과 같은 장점이 있어 높은 배너 효과가 예상됩니다:

- **긴 체류 시간**: 댓글을 읽고 쓰며 오래 머무름
- **높은 참여도**: 활발한 댓글 활동으로 페이지 스크롤 많음
- **반복 방문**: 익명성으로 인한 높은 재방문율
- **콘텐츠 집중**: 게시글 내용에 집중하다가 자연스럽게 배너 노출

**추천 시작 전략**: 1-2번 위치(사이드바 상단, 게시글 하단)부터 구현하여 성과를 확인한 후, 단계적으로 추가 위치를 확장하는 것이 효과적일 것입니다.