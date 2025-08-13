<!-- components/PostListEmpty.vue -->
<template>
  <div class="bg-background-secondary border border-border-muted rounded-lg text-center py-12">
    <Icon name="lucide:inbox" class="w-16 h-16 mx-auto text-text-tertiary mb-4" />
    <h3 class="text-lg font-medium text-text-primary mb-2">
      아직 게시글이 없습니다
    </h3>
    <p class="text-text-secondary mb-6">첫 번째 게시글을 작성해보세요.</p>

    <NuxtLink 
      to="/post/create" 
      class="inline-flex items-center px-4 py-2 bg-accent-blue text-text-inverse rounded-lg hover:bg-accent-blue-hover transition-colors font-medium text-sm"
    >
      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
      글쓰기
    </NuxtLink>
  </div>
</template>