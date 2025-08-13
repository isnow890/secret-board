<!-- components/ai/AiReviseButton.vue -->
<template>
  <div class="ai-revise-section">
    <!-- AI 처리 중 화면 전체 오버레이 효과 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="loading"
          class="fixed inset-0 z-50 pointer-events-none ai-magic-overlay"
        >
          <!-- 그라데이션 오버레이 -->
          <div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/15 to-indigo-900/20 backdrop-blur-[2px]"></div>
          
          <!-- 반짝이는 파티클 효과 -->
          <div class="sparkles-container">
            <div v-for="i in 24" :key="`sparkle-${i}`" 
                 :class="`sparkle sparkle-${i}`"
            ></div>
          </div>
          
          <!-- AI 처리 중 표시 -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="ai-processing-indicator">
              <div class="processing-content">
                <div class="magic-wand">✨</div>
                <div class="processing-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    
    <div class="flex items-center gap-2">
      <button
        :disabled="disabled || !hasContent || loading || !canUseAi"
        @click="handleReviseClick"
        class="ai-revise-button group"
        :title="!canUseAi ? `${remainingSeconds}초 후 다시 시도할 수 있습니다` : ''"
      >
        <Icon 
          name="lucide:sparkles" 
          class="w-4 h-4 mr-2 transition-all duration-200 group-hover:scale-110" 
        />
        <span v-if="!loading && canUseAi">AI 말투 변경</span>
        <span v-else-if="!loading && !canUseAi" class="flex items-center">
          <Icon name="lucide:clock" class="w-3 h-3 mr-2" />
          {{ remainingSeconds }}초 대기
        </span>
        <span v-else class="flex items-center">
          <svg class="animate-spin w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
            <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          처리 중...
        </span>
      </button>
      
      <button
        v-if="canRevert"
        :disabled="loading"
        @click="handleRevert"
        class="revert-button group"
      >
        <Icon 
          name="lucide:rotate-ccw" 
          class="w-4 h-4 mr-2 transition-all duration-200 group-hover:-rotate-180" 
        />
        원본 복원
      </button>
    </div>

    <!-- 확인 다이얼로그 -->
    <UiModal
      v-model="showDialog"
      title="AI 익명성 강화"
      :closable="!loading"
    >
      <div class="space-y-4">
        <div class="text-text-primary">
          <p class="mb-3">
            AI가 작성하신 내용을 익명성이 강화되도록 말투를 조정합니다.
          </p>
          
          <div v-if="hasMediaElements" class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-4">
            <div class="flex items-start">
              <Icon name="lucide:alert-triangle" class="w-5 h-5 text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium text-orange-200 mb-1">주의사항</p>
                <p class="text-sm text-orange-300">
                  이미지, 링크, 유튜브 동영상 등의 미디어 요소가 모두 제거되고 순수 텍스트만 남게 됩니다.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div class="flex items-start">
              <Icon name="lucide:info" class="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium text-blue-200 mb-1">변경 사항</p>
                <div class="text-sm text-blue-300 space-y-1">
                  <p>• 개인적인 말투 특성을 제거하여 일반적인 표현으로 변경</p>
                  <p>• 과도한 감정 표현을 절제된 표현으로 조정</p>
                  <p>• 구어체를 격식 있는 문체로 변경</p>
                  <p>• 내용과 논조는 그대로 유지</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton
            variant="secondary"
            :disabled="loading"
            @click="showDialog = false"
          >
            취소
          </UiButton>
          <UiButton
            variant="primary"
            :loading="loading"
            @click="handleConfirmRevise"
          >
            익명성 강화
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string;
  type?: 'html' | 'text';
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'revise-start'): void;
  (e: 'revise-success'): void;
  (e: 'revise-error', error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
});
const emit = defineEmits<Emits>();

// AI composable과 store 사용
const { reviseText, hasMediaElements: checkMediaElements, hasTextContent } = useAi();
const aiStore = useAiStore();

const showDialog = ref(false);
const loading = ref(false);
const originalText = ref<string | null>(null); // AI 처리 전 원본 텍스트 저장
const hasUsedAi = ref(false); // AI 사용 여부 플래그

// 내용이 있는지 확인
const hasContent = computed(() => {
  if (!props.modelValue || props.modelValue.trim().length === 0) {
    return false;
  }
  
  // HTML 타입인 경우 실제 텍스트 내용이 있는지 확인
  if (props.type === 'html') {
    const textContent = props.modelValue.replace(/<[^>]*>/g, ' ').trim();
    return textContent.length > 0;
  }
  
  // 텍스트 타입인 경우 빈 문자열이 아닌지 확인
  return props.modelValue.trim().length > 0;
});

// 미디어 요소가 있는지 확인
const hasMediaElements = computed(() => {
  if (props.type !== 'html') return false;
  return checkMediaElements(props.modelValue);
});

// 취소 기능 사용 가능한지 확인 (AI 사용 여부로 판단)
const canRevert = computed(() => {
  return hasUsedAi.value && originalText.value !== null;
});

// AI 리바이징 버튼 클릭
const handleReviseClick = () => {
  // 내용이 없으면 실행하지 않음
  if (!hasContent.value) return;
  
  // 쿨다운 중이면 실행하지 않음
  if (!canUseAi.value) return;
  
  if (hasMediaElements.value) {
    // 미디어 요소가 있으면 다이얼로그로 경고
    showDialog.value = true;
  } else {
    // 미디어 요소가 없으면 바로 실행
    handleConfirmRevise();
  }
};

// 원본 텍스트로 되돌리기
const handleRevert = () => {
  if (originalText.value !== null && hasUsedAi.value) {
    emit('update:modelValue', originalText.value);
    originalText.value = null; // 원본 텍스트 초기화
    hasUsedAi.value = false; // AI 사용 플래그 초기화
    
    useToast().add({
      title: '원본으로 복원',
      description: '텍스트가 AI 처리 이전 상태로 되돌려졌습니다.',
      color: 'blue',
      timeout: 2000,
    });
  }
};

// 확인 후 실제 리바이징 실행
const handleConfirmRevise = async () => {
  if (loading.value || !canUseAi.value || !hasContent.value) return;
  
  // AI 처리 전 원본 텍스트 저장
  originalText.value = props.modelValue;
  
  // 쿨다운 시작
  aiStore.markReviseStart();
  
  loading.value = true;
  emit('revise-start');

  try {
    const response = await reviseText({
      text: props.modelValue,
      type: props.type,
      preserveMedia: false, // 항상 미디어 제거 모드
      persona: 'neutral', // 기본 중립형 말투로 고정
    });

    if (response.success && response.data?.revisedText) {
      emit('update:modelValue', response.data.revisedText);
      hasUsedAi.value = true; // AI 사용 플래그 설정
      emit('revise-success');
      
      useToast().add({
        title: '익명성 강화 완료',
        description: '개인적 말투 특성이 제거되어 익명성이 강화되었습니다.',
        color: 'green',
        timeout: 3000,
      });
      
      showDialog.value = false;
    } else {
      throw new Error(response.error || 'Invalid response format');
    }

  } catch (error: any) {
    console.error('AI 리바이징 실패:', error);
    
    const errorMessage = typeof error === 'string' ? error : (error.message || 'AI 말투 변경에 실패했습니다.');
    
    emit('revise-error', errorMessage);
    
    useToast().add({
      title: '익명성 강화 실패',
      description: errorMessage,
      color: 'red',
      timeout: 5000,
    });
    
  } finally {
    loading.value = false;
  }
};

// 실시간 카운트다운을 위한 reactive 타이머
const currentTime = ref(Date.now());
let countdownInterval: NodeJS.Timeout | null = null;

// 실시간으로 업데이트되는 남은 시간 계산
const remainingSeconds = computed(() => {
  if (!aiStore.lastReviseTime || currentTime.value - aiStore.lastReviseTime >= aiStore.COOLDOWN_TIME) {
    return 0;
  }
  
  const elapsed = currentTime.value - aiStore.lastReviseTime;
  const remaining = Math.ceil((aiStore.COOLDOWN_TIME - elapsed) / 1000);
  return Math.max(0, remaining);
});

// AI 사용 가능 여부 (실시간)
const canUseAi = computed(() => {
  return remainingSeconds.value === 0;
});

onMounted(() => {
  // 100ms마다 현재 시간 업데이트 (더 부드러운 카운트다운)
  countdownInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 100);
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.ai-revise-button {
  @apply inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200;
  @apply bg-gradient-to-r from-purple-600/20 to-blue-600/20;
  @apply text-purple-300 border border-purple-500/30;
  @apply hover:from-purple-600/30 hover:to-blue-600/30 hover:border-purple-400/50;
  @apply hover:text-purple-200 hover:shadow-lg hover:shadow-purple-500/20;
  @apply focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-gray-900;
  @apply active:scale-95;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100;
}

.ai-revise-button:not(:disabled):hover {
  @apply transform translate-y-[-1px];
}

.revert-button {
  @apply inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200;
  @apply bg-gradient-to-r from-orange-600/15 to-yellow-600/15;
  @apply text-orange-300 border border-orange-500/30;
  @apply hover:from-orange-600/25 hover:to-yellow-600/25 hover:border-orange-400/50;
  @apply hover:text-orange-200 hover:shadow-lg hover:shadow-orange-500/20;
  @apply focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-gray-900;
  @apply active:scale-95;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100;
}

.revert-button:not(:disabled):hover {
  @apply transform translate-y-[-1px];
}

/* AI 마법 오버레이 효과 */
.ai-magic-overlay {
  animation: magic-pulse 3s ease-in-out infinite;
}

@keyframes magic-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* 반짝이는 파티클 효과 */
.sparkles-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  border-radius: 50%;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle:nth-child(4n+1) {
  width: 3px;
  height: 3px;
  background: linear-gradient(45deg, #a855f7, #8b5cf6);
}

.sparkle:nth-child(4n+2) {
  width: 5px;
  height: 5px;
  background: linear-gradient(45deg, #3b82f6, #06b6d4);
}

.sparkle:nth-child(4n+3) {
  width: 2px;
  height: 2px;
  background: linear-gradient(45deg, #06b6d4, #0891b2);
}

.sparkle:nth-child(4n) {
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #8b5cf6, #3b82f6);
}

.sparkle-1 { top: 20%; left: 10%; animation-delay: 0s; }
.sparkle-2 { top: 30%; left: 80%; animation-delay: 0.1s; }
.sparkle-3 { top: 60%; left: 20%; animation-delay: 0.2s; }
.sparkle-4 { top: 80%; left: 70%; animation-delay: 0.3s; }
.sparkle-5 { top: 40%; left: 90%; animation-delay: 0.4s; }
.sparkle-6 { top: 70%; left: 50%; animation-delay: 0.5s; }
.sparkle-7 { top: 15%; left: 60%; animation-delay: 0.6s; }
.sparkle-8 { top: 85%; left: 30%; animation-delay: 0.7s; }
.sparkle-9 { top: 50%; left: 15%; animation-delay: 0.8s; }
.sparkle-10 { top: 25%; left: 40%; animation-delay: 0.9s; }
.sparkle-11 { top: 75%; left: 85%; animation-delay: 1s; }
.sparkle-12 { top: 10%; left: 75%; animation-delay: 1.1s; }
.sparkle-13 { top: 35%; left: 5%; animation-delay: 1.2s; }
.sparkle-14 { top: 65%; left: 95%; animation-delay: 1.3s; }
.sparkle-15 { top: 5%; left: 45%; animation-delay: 1.4s; }
.sparkle-16 { top: 95%; left: 55%; animation-delay: 1.5s; }
.sparkle-17 { top: 45%; left: 25%; animation-delay: 1.6s; }
.sparkle-18 { top: 55%; left: 75%; animation-delay: 1.7s; }
.sparkle-19 { top: 25%; left: 65%; animation-delay: 1.8s; }
.sparkle-20 { top: 75%; left: 35%; animation-delay: 1.9s; }
.sparkle-21 { top: 12%; left: 30%; animation-delay: 2s; }
.sparkle-22 { top: 88%; left: 80%; animation-delay: 2.1s; }
.sparkle-23 { top: 40%; left: 60%; animation-delay: 2.2s; }
.sparkle-24 { top: 60%; left: 40%; animation-delay: 2.3s; }

@keyframes sparkle {
  0%, 100% { 
    opacity: 0; 
    transform: scale(0) rotate(0deg); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1) rotate(180deg); 
  }
}

/* AI 처리 중 표시 스타일 */
.ai-processing-indicator {
  @apply bg-gray-900/80 backdrop-blur-lg rounded-2xl px-8 py-6 border border-purple-500/30;
  box-shadow: 0 25px 50px -12px rgba(168, 85, 247, 0.25);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.processing-content {
  @apply flex flex-col items-center space-y-3;
}

.magic-wand {
  @apply text-4xl;
  animation: wand-rotation 2s ease-in-out infinite;
}

@keyframes wand-rotation {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-10deg) scale(1.1); }
  50% { transform: rotate(0deg) scale(1.2); }
  75% { transform: rotate(10deg) scale(1.1); }
}

.processing-text {
  @apply text-lg font-medium text-purple-200;
  animation: text-glow 2s ease-in-out infinite;
}

@keyframes text-glow {
  0%, 100% { 
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.5); 
  }
  50% { 
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.8); 
  }
}

.processing-dots {
  @apply flex space-x-2;
}

.dot {
  @apply w-2 h-2 bg-purple-400 rounded-full;
  animation: dot-bounce 1.5s ease-in-out infinite;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 60%, 100% { transform: translateY(0px); }
  30% { transform: translateY(-10px); }
}
</style>