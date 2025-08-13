<!-- pages/privacy.vue -->
<template>
  <div class="min-h-screen bg-background-primary">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- 헤더 -->
      <div class="mb-8">
        <h1 class="text-xl md:text-3xl font-bold text-text-primary mb-2">
          개인정보처리방침
        </h1>
        <p class="text-text-secondary">secret 개인정보 보호 정책</p>
        <p class="text-sm text-text-tertiary mt-2">
          최종 수정일: {{ lastUpdated }}
        </p>
      </div>

      <!-- 중요 공지 -->
      <div
        class="bg-background-secondary border border-border-muted rounded-lg p-6 mb-8"
      >
        <div class="flex items-start gap-3">
          <div>
            <h3 class="text-lg font-semibold text-text-primary mb-2">
              완전 익명 서비스
            </h3>
            <p class="text-text-secondary leading-relaxed">
              <strong
                >secret은 개인정보를 전혀 수집하지 않는 완전 익명
                게시판입니다.</strong
              ><br />
              회원가입이 없으며, IP 주소, 쿠키, 로그 등 어떠한 개인 식별 정보도
              수집하거나 저장하지 않습니다.
            </p>
          </div>
        </div>
      </div>

      <!-- 내용 -->
      <div class="prose max-w-none">
        <div class="space-y-8">
          <!-- 제1조 개인정보 처리방침 개요 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제1조 (개인정보 처리방침 개요)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-3">
              <p>
                isnow890(이하 "운영자")이 운영하는 secret(이하 "서비스")는
                이용자의 개인정보를 보호하기 위해 개인정보보호법 등 관련 법령에
                따라 다음과 같은 개인정보 처리방침을 수립・공개합니다.
              </p>
              <p>
                본 방침은 서비스가 개인정보를 어떻게 수집하고 이용하며, 이용자가
                자신의 개인정보에 대해 어떤 선택권을 가지고 있는지에 대해
                설명합니다.
              </p>
            </div>
          </section>

          <!-- 제2조 개인정보 수집 현황 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제2조 (개인정보 수집 현황)
            </h2>
            <div
              class="bg-background-secondary border border-border-muted rounded-lg p-6"
            >
              <div class="flex items-center gap-3 mb-3">
                <h3 class="text-lg font-semibold text-text-primary">
                  수집하지 않는 정보
                </h3>
              </div>
              <div class="text-text-secondary space-y-2">
                <p>
                  <strong
                    >secret은 다음과 같은 정보를 수집하지 않습니다:</strong
                  >
                </p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>이름, 이메일 주소 등의 개인 식별 정보</li>
                  <li>IP 주소 및 접속 로그</li>
                  <li>쿠키(Cookie) 및 세션 정보</li>
                  <li>디바이스 정보 및 위치 정보</li>
                  <li>회원가입 정보 (회원가입 자체가 없음)</li>
                  <li>분석을 위한 추적 정보</li>
                </ul>
                <p class="font-semibold mt-4">
                  서비스 이용을 위해 어떠한 개인정보도 요구하지 않으며,
                  기술적으로도 수집하지 않습니다.
                </p>
              </div>
            </div>
          </section>

          <!-- 제3조 게시물 정보 처리 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제3조 (게시물 정보 처리)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-3">
              <h3 class="text-lg font-medium text-text-primary">
                수집하는 게시물 정보
              </h3>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>게시글 제목 및 내용</li>
                <li>댓글 내용</li>
                <li>첨부파일 (선택사항)</li>
                <li>닉네임 (게시 시 임의로 입력하는 가명)</li>
                <li>비밀번호 (게시물 수정/삭제용, 암호화 저장)</li>
              </ul>

              <h3 class="text-lg font-medium text-text-primary mt-6">
                처리 목적
              </h3>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>게시판 서비스 제공</li>
                <li>게시물 수정 및 삭제 권한 확인</li>
                <li>서비스 품질 향상</li>
              </ul>

              <h3 class="text-lg font-medium text-text-primary mt-6">
                보관 기간
              </h3>
              <p>
                게시물은 이용자가 직접 삭제하거나 서비스 종료 시까지 보관됩니다.
              </p>
            </div>
          </section>

          <!-- 제4조 개인정보 보호를 위한 기술적 조치 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제4조 (개인정보 보호를 위한 기술적 조치)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-3">
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>암호화:</strong> 게시물 비밀번호는 해시 암호화하여
                  저장
                </li>
                <li>
                  <strong>익명성 보장:</strong> 어떠한 개인 식별 정보도 연결되지
                  않음
                </li>
                <li>
                  <strong>최소 데이터 원칙:</strong> 서비스 제공에 필요한
                  최소한의 정보만 처리
                </li>
                <li>
                  <strong>보안 연결:</strong> HTTPS 프로토콜을 통한 안전한
                  데이터 전송
                </li>
                <li>
                  <strong>접근 제어:</strong> 시스템에 대한 엄격한 접근 권한
                  관리
                </li>
              </ul>
            </div>
          </section>

          <!-- 제5조 제3자 정보 제공 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제5조 (제3자 정보 제공)
            </h2>
            <div
              class="bg-background-secondary border border-border-muted rounded-lg p-6"
            >
              <div class="flex items-center gap-3 mb-3">
                <h3 class="text-lg font-semibold text-text-primary">
                  제3자 정보 제공 없음
                </h3>
              </div>
              <div class="text-text-secondary space-y-2">
                <p>
                  <strong
                    >서비스는 어떠한 경우에도 이용자의 정보를 제3자에게 제공하지
                    않습니다.</strong
                  >
                </p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>광고 목적의 정보 제공 없음</li>
                  <li>분석 서비스 제공업체와의 정보 공유 없음</li>
                  <li>마케팅 목적의 정보 활용 없음</li>
                </ul>
                <p class="font-semibold">
                  단, 법령에 의해 요구되는 경우에도 제공할 개인정보가 존재하지
                  않습니다.
                </p>
              </div>
            </div>
          </section>

          <!-- 제6조 쿠키 등 사용 현황 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제6조 (쿠키 등 사용 현황)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-3">
              <p><strong>서비스는 쿠키를 사용하지 않습니다.</strong></p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>추적 쿠키 사용 안함</li>
                <li>분석 도구 (Google Analytics 등) 사용 안함</li>
                <li>광고 관련 쿠키 사용 안함</li>
                <li>세션 관리를 위한 쿠키도 사용 안함 (로그인 기능 없음)</li>
              </ul>
            </div>
          </section>

          <!-- 제7조 이용자 권리 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제7조 (이용자 권리)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-3">
              <p>
                개인정보를 수집하지 않으므로 다음과 같은 권리 행사 상황이
                발생하지 않습니다:
              </p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>개인정보 열람 요구</li>
                <li>개인정보 수정 요구</li>
                <li>개인정보 삭제 요구</li>
                <li>개인정보 처리 중단 요구</li>
              </ul>
              <p class="font-medium">
                단, 이용자는 자신이 작성한 게시물을 언제든지 비밀번호를 통해
                수정하거나 삭제할 수 있습니다.
              </p>
            </div>
          </section>

          <!-- 제8조 개인정보보호책임자 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제8조 (개인정보보호책임자)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-3">
              <p>
                개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와
                관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이
                개인정보보호책임자를 지정하고 있습니다.
              </p>

              <div class="bg-background-secondary rounded-lg p-4 mt-4">
                <h3 class="font-medium text-text-primary mb-2">
                  개인정보보호책임자
                </h3>
                <ul class="space-y-1">
                  <li><strong>담당자:</strong> isnow890</li>
                  <li><strong>연락처:</strong> GitHub Issues를 통해 문의</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- 제9조 개인정보 처리방침 변경 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제9조 (개인정보 처리방침 변경)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-3">
              <p>
                이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에
                따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의
                시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </div>
          </section>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="mt-12 pt-8 border-t border-border-muted">
        <div class="flex flex-col sm:flex-row gap-4 justify-between">
          <NuxtLink
            to="/terms"
            class="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <Icon name="lucide:file-text" class="w-4 h-4" />
            이용약관 보기
          </NuxtLink>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Icon name="lucide:home" class="w-4 h-4" />
            메인으로 돌아가기
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 페이지 메타 - 인증 미들웨어 제외
definePageMeta({
  layout: false,
  auth: false,
});

// 메타데이터 설정
useHead({
  title: "개인정보처리방침 - secret",
  meta: [
    {
      name: "description",
      content:
        "secret 개인정보처리방침 - 완전 익명 서비스로 개인정보를 수집하지 않습니다",
    },
    { name: "robots", content: "noindex, nofollow" },
  ],
});

// 마지막 수정일
const lastUpdated = "2025년 8월 13일";
</script>

<style scoped>
.prose {
  @apply text-text-secondary;
}

.prose h2 {
  @apply text-text-primary;
}

.prose h3 {
  @apply text-text-primary;
}

.prose ul {
  @apply text-text-secondary;
}
</style>
