<!-- components/ui/UiPagination.vue -->
<template>
  <nav v-if="totalPages > 1" class="pagination-container" role="navigation" aria-label="Pagination">
    <div class="pagination-wrapper">
      <!-- Previous Button -->
      <button
        :disabled="currentPage === 1"
        :class="[
          'pagination-button',
          'pagination-button--nav',
          { 'pagination-button--disabled': currentPage === 1 }
        ]"
        @click="$emit('page-change', currentPage - 1)"
        aria-label="Previous page"
      >
        <Icon name="lucide:chevron-left" class="w-4 h-4" />
        <span v-if="showLabels" class="pagination-label">Previous</span>
      </button>

      <!-- First Page -->
      <button
        v-if="showFirstLast && currentPage > 3"
        :class="[
          'pagination-button',
          'pagination-button--page',
          { 'pagination-button--active': currentPage === 1 }
        ]"
        @click="$emit('page-change', 1)"
        :aria-label="`Go to page 1`"
      >
        1
      </button>

      <!-- First Ellipsis -->
      <span
        v-if="showFirstLast && currentPage > 4"
        class="pagination-ellipsis"
        aria-hidden="true"
      >
        <Icon name="lucide:more-horizontal" class="w-4 h-4" />
      </span>

      <!-- Page Numbers -->
      <button
        v-for="page in visiblePages"
        :key="page"
        :class="[
          'pagination-button',
          'pagination-button--page',
          { 'pagination-button--active': currentPage === page }
        ]"
        @click="$emit('page-change', page)"
        :aria-label="`Go to page ${page}`"
        :aria-current="currentPage === page ? 'page' : undefined"
      >
        {{ page }}
      </button>

      <!-- Last Ellipsis -->
      <span
        v-if="showFirstLast && currentPage < totalPages - 3"
        class="pagination-ellipsis"
        aria-hidden="true"
      >
        <Icon name="lucide:more-horizontal" class="w-4 h-4" />
      </span>

      <!-- Last Page -->
      <button
        v-if="showFirstLast && currentPage < totalPages - 2"
        :class="[
          'pagination-button',
          'pagination-button--page',
          { 'pagination-button--active': currentPage === totalPages }
        ]"
        @click="$emit('page-change', totalPages)"
        :aria-label="`Go to page ${totalPages}`"
      >
        {{ totalPages }}
      </button>

      <!-- Next Button -->
      <button
        :disabled="currentPage === totalPages"
        :class="[
          'pagination-button',
          'pagination-button--nav',
          { 'pagination-button--disabled': currentPage === totalPages }
        ]"
        @click="$emit('page-change', currentPage + 1)"
        aria-label="Next page"
      >
        <span v-if="showLabels" class="pagination-label">Next</span>
        <Icon name="lucide:chevron-right" class="w-4 h-4" />
      </button>
    </div>

    <!-- Page Info -->
    <div v-if="showInfo" class="pagination-info">
      <span class="pagination-info-text">
        Page {{ currentPage }} of {{ totalPages }}
        <template v-if="totalItems">
          ({{ totalItems }} items)
        </template>
      </span>
    </div>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
  totalItems?: number
  maxVisiblePages?: number
  showLabels?: boolean
  showInfo?: boolean
  showFirstLast?: boolean
}

interface Emits {
  (e: 'page-change', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 5,
  showLabels: false,
  showInfo: true,
  showFirstLast: true
})

defineEmits<Emits>()

const visiblePages = computed(() => {
  const { currentPage, totalPages, maxVisiblePages } = props
  const pages: number[] = []
  
  // Calculate the range of visible pages
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  
  // Adjust if we're at the beginning or end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  
  // Generate page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>

<style scoped>
.pagination-container {
  @apply flex flex-col items-center space-y-3;
}

.pagination-wrapper {
  @apply flex items-center space-x-1;
}

.pagination-button {
  @apply inline-flex items-center justify-center min-w-[40px] h-10 px-3 py-2 text-sm font-medium text-text-primary bg-background-secondary border border-border-muted rounded-md transition-all duration-200 hover:bg-interactive-hover hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-background-primary;
  font-family: 'Inter Variable', system-ui, sans-serif;
}

.pagination-button--page {
  @apply min-w-[40px];
}

.pagination-button--nav {
  @apply px-2 space-x-1;
}

.pagination-button--active {
  @apply bg-accent-blue text-text-inverse border-accent-blue hover:bg-accent-blue-hover hover:border-accent-blue-hover;
}

.pagination-button--disabled {
  @apply opacity-50 cursor-not-allowed text-text-tertiary hover:bg-background-secondary hover:border-border-muted;
  pointer-events: none;
}

.pagination-label {
  @apply text-sm font-medium;
}

.pagination-ellipsis {
  @apply inline-flex items-center justify-center min-w-[40px] h-10 text-text-tertiary;
}

.pagination-info {
  @apply text-center;
}

.pagination-info-text {
  @apply text-sm text-text-secondary;
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .pagination-wrapper {
    @apply space-x-0.5;
  }
  
  .pagination-button {
    @apply min-w-[36px] h-9 px-2 text-xs;
  }
  
  .pagination-button--nav {
    @apply px-1.5;
  }
  
  .pagination-label {
    @apply hidden;
  }
  
  .pagination-info-text {
    @apply text-xs;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .pagination-button {
    @apply border-2;
  }
  
  .pagination-button--active {
    @apply border-primary-400;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .pagination-button {
    @apply transition-none;
  }
}

/* Focus visible styling */
.pagination-button:focus-visible {
  @apply ring-2 ring-accent-blue ring-offset-2 ring-offset-background-primary outline-none;
}

/* Dark mode optimizations (already handled by design tokens) */
.pagination-button:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.pagination-button--active:hover {
  background-color: #4b59c4;
}
</style>