<!-- components/CommentList.vue -->
<template>
  <div class="comment-list">
    <!-- 댓글 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-text-primary flex items-center">
        <Icon name="lucide:message-circle" class="w-5 h-5 mr-2" />
        댓글 {{ totalCount }}개
      </h2>

      <UiButton
        @click="refresh"
        variant="ghost"
        size="sm"
        :disabled="loading"
        title="새로고침"
      >
        <Icon
          name="lucide:refresh-cw"
          class="w-4 h-4"
          :class="{ 'animate-spin': loading }"
        />
      </UiButton>
    </div>

    <!-- 댓글 작성 폼 (삭제된 게시글이 아닌 경우만) -->
    <CommentForm
      v-if="!isPostDeleted"
      :post-id="postId"
      :author-nickname="authorNickname"
      @success="handleCommentSuccess"
      class="mb-6"
    />

    <!-- 댓글 목록 -->
    <div>
      <!-- 로딩 상태 -->
      <div v-if="loading && comments.length === 0" class="space-y-4">
        <CommentSkeleton v-for="n in 3" :key="n" />
      </div>

      <!-- 댓글 없음 -->
      <div
        v-else-if="!loading && comments.length === 0"
        class="bg-background-secondary border border-border-muted rounded-lg p-4 text-center text-text-secondary mb-6"
      >
        <Icon
          name="lucide:message-circle"
          class="w-5 h-5 mx-auto mb-2 text-text-tertiary"
        />
        <p>아직 댓글이 없습니다</p>
      </div>

      <!-- 댓글 리스트 -->
      <div v-else class="comment-list-container">
        <template v-for="(comment, index) in flattenedComments" :key="comment.id">
          <CommentItem
            :comment="comment as Comment"
            :post-id="postId"
            :author-nickname="authorNickname"
            :comment-index="index"
            @reply-success="handleReplySuccess"
            @like="handleCommentLike"
            @delete-success="handleDeleteSuccess"
          />
          
          <!-- 5개마다 쿠팡 광고 삽입 (단, 마지막 댓글 이후는 제외) -->
          <div 
            v-if="shouldShowCommentAd(index) && index < flattenedComments.length - 1" 
            class="py-4 my-4 border-t border-b border-border-muted bg-background-secondary/20"
          >
            <div class="w-full">
              <CoupangAd 
                v-if="commentAdEnabled && commentAdUrl"
                :src="commentAdUrl" 
                :height="84" 
                :width="'80%'"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 에러 상태 -->
    <UiAlert v-if="error" variant="error" class="text-center">
      <div class="mb-2">댓글을 불러오지 못했습니다</div>
      <UiButton @click="refresh" variant="ghost" size="sm" class="underline">
        다시 시도
      </UiButton>
    </UiAlert>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useComments } from "~/composables/useComments";
import type { Comment } from "~/types";

interface Props {
  postId: string;
  authorNickname?: string;
  isPostDeleted?: boolean;
}

const props = defineProps<Props>();

// 환경변수에서 쿠팡 광고 설정 가져오기
const config = useRuntimeConfig();
const commentAdEnabled = computed(() => config.public.adVisible === 'true' && config.public.adPostDetailEnabled === 'true');
const commentAdUrl = computed(() => config.public.coupangPostAdUrl);

// 5개마다 댓글 광고 표시 여부 결정
const shouldShowCommentAd = (index: number): boolean => {
  // 인덱스가 0부터 시작하므로 (index + 1)이 5의 배수일 때 광고 표시
  return (index + 1) % 5 === 0;
};

// useComments composable 사용
const {
  comments,
  loading,
  error,
  totalCount,
  fetchComments,
  // createComment,
  // createReply,
  likeComment,
  refresh,
} = useComments(props.postId);

// 중첩된 댓글을 평면화하는 함수
const flattenComments = (commentList: any[]): Comment[] => {
  const result: Comment[] = [];

  const addComment = (
    comment: any,
    currentDepth: number = 0,
    parentNickname?: string
  ) => {
    // depth와 부모 정보를 명시적으로 설정
    const flattenedComment: Comment = {
      ...comment,
      depth: currentDepth,
      parentNickname: parentNickname,
    };

    result.push(flattenedComment);

    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach((reply: any) =>
        addComment(reply, currentDepth + 1, comment.nickname)
      );
    }
  };

  commentList.forEach((comment) => addComment(comment, 0));
  return result;
};

// 평면화된 댓글 목록
const flattenedComments = computed(() =>
  flattenComments(comments.value as any[])
);

// 댓글 작성 성공 핸들러
const handleCommentSuccess = async (newComment?: any) => {
  // 댓글 작성 후 목록 새로고침
  await refresh();

  // 새로 작성된 댓글로 스크롤 이동
  if (newComment?.id) {
    await nextTick();
    const commentElement = document.getElementById(`comment-${newComment.id}`);
    if (commentElement) {
      commentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // 새 댓글 강조 효과
      commentElement.classList.add("highlight-new-comment");
      setTimeout(() => {
        commentElement.classList.remove("highlight-new-comment");
      }, 3000);
    }
  }
};

// 답글 작성 성공 핸들러
const handleReplySuccess = () => {
  // 답글 작성 후 목록 새로고침
  refresh();
};

// 댓글 좋아요 핸들러
const handleCommentLike = async (commentId: string) => {
  await likeComment(commentId);
};

// 댓글 삭제 성공 핸들러
const handleDeleteSuccess = () => {
  // 댓글 삭제 후 목록 새로고침
  refresh();
};

// 컴포넌트 마운트시 댓글 조회
onMounted(() => {
  fetchComments();
});

// 컴포넌트 외부에서 새로고침 가능하도록 expose
defineExpose({
  refresh,
});
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 댓글 구분 - 경계선만 사용 */
.comment-list-container :deep(.comment-item) {
  border-bottom: 1px solid rgba(229, 231, 235, 0.2); /* border-gray-200/30% - 더 연하게 */
}

.comment-list-container :deep(.comment-item:last-child) {
  border-bottom: none;
}

/* 다크 모드 경계선 */
.dark .comment-list-container :deep(.comment-item) {
  border-bottom-color: rgba(
    75,
    85,
    99,
    0.2
  ); /* border-gray-600/20% - 더 연하게 */
}

/* 새 댓글 강조 효과 */
:deep(.highlight-new-comment) {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border-left: 4px solid rgb(59, 130, 246);
  transition: all 0.3s ease;
  animation: highlight-fade-in 0.5s ease-out;
}

@keyframes highlight-fade-in {
  0% {
    background-color: rgba(59, 130, 246, 0.3);
    transform: scale(1.02);
  }
  100% {
    background-color: rgba(59, 130, 246, 0.1);
    transform: scale(1);
  }
}

/* 다크 모드에서의 강조 효과 */
.dark :deep(.highlight-new-comment) {
  background-color: rgba(59, 130, 246, 0.2) !important;
  border-left-color: rgb(96, 165, 250);
}

@keyframes highlight-fade-in-dark {
  0% {
    background-color: rgba(59, 130, 246, 0.4);
  }
  100% {
    background-color: rgba(59, 130, 246, 0.2);
  }
}

.dark :deep(.highlight-new-comment) {
  animation: highlight-fade-in-dark 0.5s ease-out;
}
</style>
