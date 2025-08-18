<!-- pages/terms.vue -->
<template>
  <div class="min-h-screen bg-background-primary">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- 헤더 -->
      <div class="mb-8">
        <h1 class="text-xl md:text-3xl font-bold text-text-primary mb-2">
          이용약관
        </h1>
        <p class="text-text-secondary">secret 서비스 이용약관</p>
        <p class="text-sm text-text-tertiary mt-2">
          최종 수정일: {{ lastUpdated }}
        </p>
      </div>

      <!-- 내용 -->
      <div class="prose max-w-none">
        <div class="space-y-8">
          <!-- 제1조 목적 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제1조 (목적)
            </h2>
            <p class="text-text-secondary leading-relaxed mb-4">
              이 약관은 isnow890이 운영하는 secret(이하 "서비스")의 이용과
              관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임사항, 기타
              필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <!-- 제2조 정의 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제2조 (정의)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>
                1. "서비스"란 isnow890이 운영하는 익명 게시판 서비스를
                의미합니다.
              </p>
              <p>
                2. "이용자"란 이 약관에 따라 서비스를 이용하는 모든 개인을
                의미합니다.
              </p>
              <p>
                3. "게시물"란 이용자가 서비스에 게시한 글, 댓글, 파일 등 모든
                정보를 의미합니다.
              </p>
            </div>
          </section>

          <!-- 제3조 약관의 효력 및 변경 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제3조 (약관의 효력 및 변경)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>1. 이 약관은 서비스에 게시함으로써 효력이 발생합니다.</p>
              <p>
                2. 회사는 필요 시 이 약관을 변경할 수 있으며, 변경된 약관은
                서비스에 공지합니다.
              </p>
              <p>
                3. 이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을
                중단할 수 있습니다.
              </p>
            </div>
          </section>

          <!-- 제4조 서비스의 제공 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제4조 (서비스의 제공)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>1. 서비스는 secret 서비스를 제공합니다.</p>
              <p>
                2. 서비스는 24시간 제공되나, 시스템 점검, 서버 장애 등의 사유로
                일시 중단될 수 있습니다.
              </p>
              <p>
                3. 서비스는 무료로 제공되며, 별도의 회원가입이 필요하지
                않습니다.
              </p>
            </div>
          </section>

          <!-- 제5조 이용자의 의무 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제5조 (이용자의 의무)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>이용자는 다음과 같은 행위를 해서는 안 됩니다:</p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>타인의 명예를 훼손하거나 모독하는 내용의 게시</li>
                <li>음란하거나 선정적인 내용의 게시</li>
                <li>불법적인 내용의 게시</li>
                <li>저작권을 침해하는 내용의 게시</li>
                <li>서비스의 안정적 운영을 방해하는 행위</li>
                <li>다른 이용자의 서비스 이용을 방해하는 행위</li>
              </ul>
            </div>
          </section>

          <!-- 제6조 게시물의 관리 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제6조 (게시물의 관리)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>1. 이용자는 자신이 게시한 게시물에 대한 책임을 집니다.</p>
              <p>
                2. 회사는 약관을 위반하는 게시물을 사전 통지 없이 삭제할 수
                있습니다.
              </p>
              <p>
                3. 이용자는 게시물 작성 시 입력한 비밀번호로 자신의 게시물을
                수정, 삭제할 수 있습니다.
              </p>
            </div>
          </section>

          <!-- 제7조 개인정보보호 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제7조 (개인정보보호)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>
                1. 서비스는 완전 익명으로 운영되며, 개인정보를 수집하지
                않습니다.
              </p>
              <p>2. IP 주소, 쿠키 등의 기술적 정보도 수집하지 않습니다.</p>
              <p>3. 자세한 내용은 개인정보처리방침을 참조하시기 바랍니다.</p>
            </div>
          </section>

          <!-- 제8조 면책조항 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제8조 (면책조항)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>
                1. 회사는 서비스 이용과 관련하여 이용자에게 발생한 손해에 대해
                책임지지 않습니다.
              </p>
              <p>2. 회사는 이용자가 게시한 내용에 대해 책임지지 않습니다.</p>
              <p>
                3. 서비스는 무료로 제공되며, 서비스 중단으로 인한 손해에 대해
                책임지지 않습니다.
              </p>
            </div>
          </section>

          <!-- 제9조 분쟁해결 -->
          <section>
            <h2 class="text-xl font-semibold text-text-primary mb-4">
              제9조 (분쟁해결)
            </h2>
            <div class="text-text-secondary leading-relaxed space-y-2">
              <p>1. 이 약관은 대한민국 법령에 따라 해석됩니다.</p>
              <p>
                2. 서비스 이용과 관련된 분쟁은 대한민국의 법원에서 해결합니다.
              </p>
            </div>
          </section>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="mt-12 pt-8 border-t border-border-muted">
        <div class="flex flex-col sm:flex-row gap-4 justify-between">
          <NuxtLink
            to="/privacy"
            class="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <Icon name="lucide:shield-check" class="w-4 h-4" />
            개인정보처리방침 보기
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
  title: "이용약관 - secret",
  meta: [
    { name: "description", content: "secret 서비스 이용약관" },
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

.prose ul {
  @apply text-text-secondary;
}
</style>
