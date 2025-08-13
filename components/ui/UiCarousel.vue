<template>
  <div :class="carouselClasses">
    <div class="relative overflow-hidden" ref="carouselContainer">
      <!-- Slides Container -->
      <div 
        class="flex transition-transform duration-500 ease-in-out"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <div 
          v-for="(slide, index) in slides"
          :key="index"
          class="w-full flex-shrink-0"
          :class="slideClasses"
        >
          <slot name="slide" :slide="slide" :index="index">
            <div class="h-full flex items-center justify-center bg-background-elevated rounded-lg">
              <div class="text-center p-8">
                <h3 v-if="slide.title" class="text-xl font-semibold text-text-primary mb-4">
                  {{ slide.title }}
                </h3>
                <p v-if="slide.description" class="text-text-secondary">
                  {{ slide.description }}
                </p>
                <img 
                  v-if="slide.image" 
                  :src="slide.image" 
                  :alt="slide.title || 'Slide image'"
                  class="max-w-full h-auto mx-auto rounded-lg"
                />
              </div>
            </div>
          </slot>
        </div>
      </div>
      
      <!-- Navigation Arrows -->
      <template v-if="showArrows && slides.length > 1">
        <UiButton
          variant="ghost"
          size="sm"
          class="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background-overlay hover:bg-background-elevated"
          @click="previousSlide"
          :disabled="!canGoPrevious"
        >
          <Icon name="lucide:chevron-left" class="w-5 h-5" />
        </UiButton>
        
        <UiButton
          variant="ghost"
          size="sm"
          class="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background-overlay hover:bg-background-elevated"
          @click="nextSlide"
          :disabled="!canGoNext"
        >
          <Icon name="lucide:chevron-right" class="w-5 h-5" />
        </UiButton>
      </template>
    </div>
    
    <!-- Dots Indicator -->
    <div v-if="showDots && slides.length > 1" class="flex justify-center space-x-2 mt-6">
      <button
        v-for="(_, index) in slides"
        :key="`dot-${index}`"
        :class="dotClasses(index)"
        @click="goToSlide(index)"
        :aria-label="`Go to slide ${index + 1}`"
      />
    </div>
    
    <!-- Slide Counter -->
    <div v-if="showCounter && slides.length > 1" class="text-center mt-4">
      <span class="text-sm text-text-secondary">
        {{ currentIndex + 1 }} / {{ slides.length }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CarouselSlide {
  title?: string
  description?: string
  image?: string
  [key: string]: any
}

interface CarouselProps {
  slides: CarouselSlide[]
  autoplay?: boolean
  interval?: number
  showArrows?: boolean
  showDots?: boolean
  showCounter?: boolean
  loop?: boolean
  height?: string
  class?: string
}

const props = withDefaults(defineProps<CarouselProps>(), {
  autoplay: false,
  interval: 5000,
  showArrows: true,
  showDots: true,
  showCounter: false,
  loop: true,
  height: '400px'
})

const emit = defineEmits<{
  slideChange: [index: number]
}>()

const currentIndex = ref(0)
const carouselContainer = ref<HTMLElement>()
let autoplayTimer: ReturnType<typeof setInterval> | null = null

const carouselClasses = computed(() => {
  const baseClasses = ['w-full']
  
  return [
    ...baseClasses,
    props.class
  ].filter(Boolean).join(' ')
})

const slideClasses = computed(() => [
  props.height ? '' : 'min-h-[400px]',
  props.height ? `h-[${props.height}]` : ''
].filter(Boolean).join(' '))

const canGoPrevious = computed(() => {
  return props.loop || currentIndex.value > 0
})

const canGoNext = computed(() => {
  return props.loop || currentIndex.value < props.slides.length - 1
})

const dotClasses = (index: number) => {
  const baseClasses = [
    'w-2',
    'h-2',
    'rounded-full',
    'transition-colors',
    'duration-200'
  ]
  
  if (index === currentIndex.value) {
    return [...baseClasses, 'bg-primary-500'].join(' ')
  } else {
    return [...baseClasses, 'bg-border-muted', 'hover:bg-border-DEFAULT'].join(' ')
  }
}

const goToSlide = (index: number) => {
  if (index >= 0 && index < props.slides.length) {
    currentIndex.value = index
    emit('slideChange', index)
  }
}

const nextSlide = () => {
  if (canGoNext.value) {
    if (currentIndex.value === props.slides.length - 1 && props.loop) {
      goToSlide(0)
    } else {
      goToSlide(currentIndex.value + 1)
    }
  }
}

const previousSlide = () => {
  if (canGoPrevious.value) {
    if (currentIndex.value === 0 && props.loop) {
      goToSlide(props.slides.length - 1)
    } else {
      goToSlide(currentIndex.value - 1)
    }
  }
}

const startAutoplay = () => {
  if (props.autoplay && props.slides.length > 1) {
    autoplayTimer = setInterval(() => {
      nextSlide()
    }, props.interval)
  }
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      previousSlide()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextSlide()
      break
    case 'Home':
      event.preventDefault()
      goToSlide(0)
      break
    case 'End':
      event.preventDefault()
      goToSlide(props.slides.length - 1)
      break
  }
}

// Touch/swipe support
const touchStart = ref({ x: 0, y: 0 })
const touchEnd = ref({ x: 0, y: 0 })

const handleTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  touchStart.value = { x: touch.clientX, y: touch.clientY }
}

const handleTouchMove = (event: TouchEvent) => {
  const touch = event.touches[0]
  touchEnd.value = { x: touch.clientX, y: touch.clientY }
}

const handleTouchEnd = () => {
  const deltaX = touchStart.value.x - touchEnd.value.x
  const deltaY = Math.abs(touchStart.value.y - touchEnd.value.y)
  
  // Only handle horizontal swipes
  if (Math.abs(deltaX) > 50 && deltaY < 100) {
    if (deltaX > 0) {
      nextSlide()
    } else {
      previousSlide()
    }
  }
}

onMounted(() => {
  startAutoplay()
  
  if (carouselContainer.value) {
    carouselContainer.value.addEventListener('keydown', handleKeydown)
    carouselContainer.value.addEventListener('touchstart', handleTouchStart)
    carouselContainer.value.addEventListener('touchmove', handleTouchMove)
    carouselContainer.value.addEventListener('touchend', handleTouchEnd)
  }
})

onUnmounted(() => {
  stopAutoplay()
  
  if (carouselContainer.value) {
    carouselContainer.value.removeEventListener('keydown', handleKeydown)
    carouselContainer.value.removeEventListener('touchstart', handleTouchStart)
    carouselContainer.value.removeEventListener('touchmove', handleTouchMove)
    carouselContainer.value.removeEventListener('touchend', handleTouchEnd)
  }
})


// Watch for autoplay changes
watch(() => props.autoplay, (newValue) => {
  if (newValue) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
})

// Expose methods for parent components
defineExpose({
  goToSlide,
  nextSlide,
  previousSlide,
  currentIndex: readonly(currentIndex)
})
</script>