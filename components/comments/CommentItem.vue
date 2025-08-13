<!-- components/comments/CommentItem.vue -->
<template>
  <div
    :id="`comment-${comment.id}`"
    class="comment-item group py-4 px-4 transition-colors duration-200 focus-within:opacity-80 relative"
    :class="getCommentClasses()"
    :style="getCommentStyle()"
    :data-comment-id="comment.id"
    :data-depth="comment.depth || 0"
  >
    <!-- 댓글 메타 정보 (작성자, 시간, 배지) -->
    <CommentMeta
      :nickname="comment.nickname"
      :is-author="comment.is_author"
      :created-at="comment.created_at"
      :depth="comment.depth || 0"
      :parent-nickname="comment.parentNickname || ''"
      time-format="relative"
    />

    <!-- 댓글 내용 -->
    <CommentContent
      :content="commentContent"
      :is-deleted="comment.is_deleted"
      :updated-at="commentUpdatedAt"
      :created-at="comment.created_at"
      class="mb-3"
    />

    <!-- 댓글 액션들 -->
    <CommentActions
      :show-like="true"
      :show-reply="true"
      :show-edit="true"
      :show-delete="true"
      :show-secondary-actions="true"
      :show-edit-form="showEditForm"
      :is-deleted="comment.is_deleted"
      :is-liked="isLiked"
      :like-count="commentLikeCount"
      :reply-count="comment.reply_count"
      :liking="liking"
      :deleting="deleting"
      @like="handleLike"
      @reply="toggleReplyForm"
      @edit="handleEditClick"
      @delete="showDeleteModal = true"
    />

    <!-- 답글 작성 폼 -->
    <div v-if="showReplyForm" class="mt-4">
      <CommentForm
        :post-id="postId"
        :parent-comment="comment"
        :author-nickname="authorNickname"
        compact
        @success="handleReplySuccess"
        @cancel="showReplyForm = false"
      />
    </div>

    <!-- 댓글 수정 폼 (비밀번호 확인 후 표시) -->
    <div v-if="showEditForm" class="mt-4">
      <div class="space-y-3 p-4 bg-background-secondary rounded-lg">
        <UiTextarea
          v-model="editContent"
          placeholder="댓글 내용을 입력하세요..."
          :rows="3"
          :maxlength="1000"
          :error="editError"
          show-char-count
        />

        <div class="flex justify-end space-x-2">
          <UiButton
            @click="cancelEdit"
            variant="ghost"
            size="sm"
            :disabled="editing"
          >
            취소
          </UiButton>
          <UiButton
            @click="handleEditSubmit"
            variant="primary"
            size="sm"
            :disabled="editing || !editContent.trim()"
            :loading="editing"
          >
            수정
          </UiButton>
        </div>
      </div>
    </div>

    <!-- 댓글 수정 비밀번호 확인 모달 -->
    <PasswordConfirmDialog
      ref="editDialogRef"
      :show="showEditModal"
      title="댓글 수정"
      message="댓글을 수정하려면 작성 시 사용한 비밀번호를 입력해주세요."
      confirm-text="확인"
      loading-text="확인 중..."
      :placeholder="
        comment.is_author
          ? '게시글과 같은 비밀번호'
          : '댓글 작성 시 사용한 비밀번호'
      "
      confirm-icon="lucide:edit"
      @confirm="handleEditPasswordConfirm"
      @cancel="showEditModal = false"
    />

    <!-- 댓글 삭제 비밀번호 확인 모달 -->
    <PasswordConfirmDialog
      ref="deleteDialogRef"
      :show="showDeleteModal"
      title="댓글 삭제"
      message="댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다."
      confirm-text="삭제"
      loading-text="삭제 중..."
      :placeholder="
        comment.is_author
          ? '게시글과 같은 비밀번호'
          : '댓글 작성 시 사용한 비밀번호'
      "
      confirm-icon="lucide:trash-2"
      danger-mode
      @confirm="handleDeletePasswordConfirm"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { Comment } from "~/types";

interface Props {
  comment: Comment;
  postId: string;
  authorNickname?: string;
  commentIndex?: number;
  isLast?: boolean;
}

interface Emits {
  (e: "replySuccess", reply: Comment, parentId: string): void;
  (e: "like", commentId: string): void;
  (e: "deleteSuccess", commentId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// useComments composable 사용
const { deleteComment, editComment, verifyCommentPassword } = useComments(
  props.postId
);

// 댓글 좋아요 관리
const { toggleCommentLike } = useCommentLikes();

// 상태
const showReplyForm = ref(false);
const showEditForm = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const editContent = ref("");
const editPassword = ref("");
const liking = ref(false);
const deleting = ref(false);
const editing = ref(false);
const isLiked = ref(false);
const editError = ref("");

// 모달 참조
const editDialogRef = ref();
const deleteDialogRef = ref();

// 댓글의 좋아요 수를 반응형으로 관리
const commentLikeCount = ref(props.comment.like_count);

// 댓글 내용을 반응형으로 관리
const commentContent = ref(
  props.comment.is_deleted ? "삭제된 댓글입니다" : props.comment.content
);
const commentUpdatedAt = ref(props.comment.updated_at);

// New comment logic moved to CommentMeta molecule

// 좋아요 상태 확인
const checkLikedStatus = () => {
  try {
    const { isCommentLiked } = useLocalStorage();
    isLiked.value = isCommentLiked(props.comment.id);
  } catch (error) {
    console.error("좋아요 상태 확인 실패:", error);
    isLiked.value = false;
  }
};

onMounted(() => {
  checkLikedStatus();
});

// 답글 폼 토글
const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value;
};

// 수정 버튼 클릭 핸들러
const handleEditClick = () => {
  console.log("수정 버튼 클릭됨");
  console.log("showEditModal 현재 값:", showEditModal.value);
  showEditModal.value = true;
  console.log("showEditModal 변경 후:", showEditModal.value);
};

// 댓글 수정 비밀번호 확인 후 수정 폼 표시
const handleEditPasswordConfirm = async (password: string) => {
  editDialogRef.value?.setLoading(true);

  try {
    // 비밀번호 확인 API 호출
    await verifyCommentPassword(props.comment.id, password);

    // 비밀번호 확인 성공 시 수정 폼 표시
    editPassword.value = password;
    showEditModal.value = false;
    showEditForm.value = true;
    editContent.value = commentContent.value;
    editError.value = "";
  } catch (error: any) {
    console.error("비밀번호 확인 실패:", error);
    editDialogRef.value?.setError("비밀번호가 일치하지 않습니다.");
  }
};

// 수정 내용 제출
const handleEditSubmit = async () => {
  if (!editContent.value.trim() || !editPassword.value.trim()) return;

  editing.value = true;
  editError.value = "";

  try {
    const response = await editComment(
      props.comment.id,
      editContent.value.trim(),
      editPassword.value
    );

    if (response) {
      // 수정 성공 - 반응형 데이터 업데이트
      commentContent.value = response.content;
      commentUpdatedAt.value =
        response.updated_at ||
        props.comment.updated_at ||
        new Date().toISOString();

      showEditForm.value = false;
      editContent.value = "";
      editPassword.value = "";
      editError.value = "";

      useToast().add({
        title: "댓글이 수정되었습니다",
      });
    }
  } catch (error: any) {
    console.error("댓글 수정 실패:", error);

    // 에러 메시지 설정
    if (
      error.data?.statusMessage === "비밀번호가 일치하지 않습니다." ||
      error.statusMessage === "비밀번호가 일치하지 않습니다."
    ) {
      editError.value = "비밀번호가 일치하지 않습니다.";
    } else {
      editError.value = "댓글 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
    }
  } finally {
    editing.value = false;
  }
};

// 댓글 수정 취소
const cancelEdit = () => {
  showEditForm.value = false;
  editContent.value = "";
  editPassword.value = "";
  editError.value = "";
};

// 좋아요 핸들러
const handleLike = async () => {
  if (liking.value) return;

  liking.value = true;
  const currentLikeCount = commentLikeCount.value;

  try {
    const result = await toggleCommentLike(props.comment.id, currentLikeCount);

    if (result.success) {
      isLiked.value = result.isLiked;
      commentLikeCount.value = result.likeCount;
    }
  } catch (error) {
    console.error("좋아요 처리 실패:", error);
    // 오류 시 좋아요 상태 다시 확인
    checkLikedStatus();
  } finally {
    liking.value = false;
  }
};

// 답글 성공 핸들러
const handleReplySuccess = (reply: Comment) => {
  showReplyForm.value = false;
  emit("replySuccess", reply, props.comment.id);
};

// 댓글 삭제 비밀번호 확인 및 삭제 처리
const handleDeletePasswordConfirm = async (password: string) => {
  deleteDialogRef.value?.setLoading(true);

  try {
    // useComments composable 사용 (토스트 메시지 없이)
    const response = await deleteComment(props.comment.id, password, false);

    if (response?.success) {
      // 모달 닫기
      showDeleteModal.value = false;

      // 성공 토스트
      useToast().add({
        title: "댓글이 삭제되었습니다",
      });

      // 부모 컴포넌트에 삭제 완료 알림
      emit("deleteSuccess", props.comment.id);
    }
  } catch (error: any) {
    console.error("댓글 삭제 실패:", error);

    // 에러 메시지를 다이얼로그에 표시
    let errorMessage = "댓글 삭제 중 오류가 발생했습니다.";

    if (
      error.data?.statusMessage === "비밀번호가 일치하지 않습니다." ||
      error.statusMessage === "비밀번호가 일치하지 않습니다."
    ) {
      errorMessage = "비밀번호가 일치하지 않습니다.";
    }

    deleteDialogRef.value?.setError(errorMessage);
  }
};

// Utility functions moved to atomic components

// localStorage 변경 감지
onMounted(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "board_liked_comments") {
      checkLikedStatus();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  onBeforeUnmount(() => {
    window.removeEventListener("storage", handleStorageChange);
  });
});

// 댓글 중첩 스타일 계산
const getCommentStyle = () => {
  const depth = props.comment.depth || 0;

  // 중첩된 댓글은 depth에 비례한 들여쓰기 적용
  if (depth > 0) {
    // SSR 호환을 위해 process.client 체크 후 반응형 처리
    if (process.client) {
      const width = window.innerWidth;
      let indentSize: number;

      if (width < 640) {
        // 모바일: depth당 16px
        indentSize = 16;
      } else if (width < 1024) {
        // 태블릿: depth당 20px
        indentSize = 20;
      } else {
        // 데스크톱: depth당 24px
        indentSize = 24;
      }

      return {
        marginLeft: `${indentSize * depth}px`,
        position: "relative" as const,
      };
    }

    // SSR 시 기본값 (데스크톱 기준: depth당 24px)
    return {
      marginLeft: `${24 * depth}px`,
      position: "relative" as const,
    };
  }

  // depth가 0인 최상위 댓글은 들여쓰기 없음
  return {
    marginLeft: "0px",
    position: "relative" as const,
  };
};

// 댓글 CSS 클래스 계산
const getCommentClasses = () => {
  const classes = [];

  // 마지막 댓글이 아니면 아래쪽 border 추가
  if (!props.isLast) {
    classes.push("border-b", "border-gray-100", "dark:border-gray-800");
  }

  return classes.join(" ");
};
</script>

<style scoped>
.comment-item {
  position: relative;
}

.fill-current {
  fill: currentColor;
}

/* 중첩 댓글 시각적 구분 - 동적 위치 계산 */
.comment-item[data-depth]:not([data-depth="0"])::before {
  position: absolute;
  top: 20px;
  color: var(--color-text-quaternary);
  font-family: monospace;
  font-size: 14px;
  font-weight: normal;
}

/* depth별 동적 위치 */
.comment-item[data-depth="1"]::before {
  left: 8px;
}
.comment-item[data-depth="2"]::before {
  left: 32px;
}
.comment-item[data-depth="3"]::before {
  left: 56px;
}
.comment-item[data-depth="4"]::before {
  left: 80px;
}
.comment-item[data-depth="5"]::before {
  left: 104px;
}

/* 반응형 들여쓰기 - 모바일에서 간격 축소 */
@media (max-width: 640px) {
  .comment-item[data-depth]:not([data-depth="0"])::before {
    top: 16px;
    font-size: 12px;
  }

  /* 모바일에서 depth별 위치 (16px 간격) */
  .comment-item[data-depth="1"]::before {
    left: 6px;
  }
  .comment-item[data-depth="2"]::before {
    left: 22px;
  }
  .comment-item[data-depth="3"]::before {
    left: 38px;
  }
  .comment-item[data-depth="4"]::before {
    left: 54px;
  }
  .comment-item[data-depth="5"]::before {
    left: 70px;
  }

  .comment-item {
    @apply py-3; /* 모바일에서 패딩 축소 */
  }
}

/* 부드러운 애니메이션 */
.comment-item {
  transition: all 0.2s ease;
}
</style>
