<!-- pages/post/[id].vue -->
<template>
  <div class="min-h-screen bg-background-primary">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- 상단 네비게이션 -->
      <PostDetailActions
        v-if="post"
        :show-actions="true"
        :is-deleted="post.is_deleted || false"
        @goBack="handleGoBack"
        @edit="handleEdit"
        @delete="handleDeleteRequest"
      />

      <!-- 로딩 상태 -->
      <div v-if="pending" class="space-y-4">
        <div class="animate-pulse">
          <div class="h-8 bg-background-secondary rounded w-3/4 mb-6"></div>
          <div class="space-y-3">
            <div class="h-4 bg-background-secondary rounded"></div>
            <div class="h-4 bg-background-secondary rounded w-5/6"></div>
            <div class="h-4 bg-background-secondary rounded w-4/6"></div>
          </div>
        </div>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="text-center py-12">
        <Icon
          name="lucide:alert-circle"
          class="w-16 h-16 mx-auto text-status-error opacity-60 mb-4"
        />
        <h2 class="text-xl font-semibold text-text-primary mb-2">
          게시글을 불러올 수 없습니다
        </h2>
        <p class="text-text-secondary mb-4">
          {{ error || "알 수 없는 오류가 발생했습니다." }}
        </p>
        <button @click="refresh()" class="btn btn-primary">다시 시도</button>
      </div>

      <!-- 게시글 내용 -->
      <article v-else-if="post" class="space-y-6">
        <!-- 게시글 헤더 -->
        <PostHeader
          :post="post"
          :is-liked="isLiked"
          :display-like-count="displayLikeCount"
          :like-pending="likePending"
          @toggle-like="toggleLike"
        />

        <!-- 게시글 본문 -->
        <PostContent 
          :post="post" 
          :is-liked="isLiked"
          :display-like-count="displayLikeCount"
          :like-pending="likePending"
          :ai-summary-generating="aiSummaryGenerating"
          @toggle-like="toggleLike"
        />
        
        <!-- 쿠팡 광고 배너 (게시글 하단) -->
        <div v-if="shouldShowPostAd" class="mt-8 mb-8 border-t border-b border-border-muted py-6">
          <CoupangAd 
            :src="postAdUrl"
            :width="'80%'"
            :height="84"
          />
        </div>
      </article>

      <!-- 댓글 섹션 -->
      <div v-if="post" class="mt-12 pt-8 border-t border-border-muted">
        <CommentList
          :post-id="postId"
          :author-nickname="post.nickname"
          :is-post-deleted="post.is_deleted || false"
          ref="commentListRef"
        />
      </div>

      <!-- 삭제 확인 모달 -->
      <PasswordConfirmDialog
        ref="deleteDialogRef"
        :show="showDeleteModal"
        title="게시글 삭제"
        message="이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다. 댓글과 첨부파일도 함께 삭제됩니다."
        confirm-text="삭제"
        loading-text="삭제 중..."
        placeholder="게시글 작성 시 입력한 비밀번호"
        confirm-icon="lucide:trash-2"
        danger-mode
        @confirm="handleDeleteConfirm"
        @cancel="cancelDelete"
      />

      <!-- 수정 권한 확인 모달 -->
      <PasswordConfirmDialog
        ref="editPasswordDialogRef"
        :show="showEditPasswordModal"
        title="게시글 수정"
        message="게시글을 수정하려면 작성 시 사용한 비밀번호를 입력해주세요."
        confirm-text="확인"
        loading-text="확인 중..."
        placeholder="게시글 작성 시 사용한 비밀번호"
        confirm-icon="lucide:edit"
        @confirm="handleEditPasswordConfirmWithErrorHandling"
        @cancel="cancelEdit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 컴포넌트 명시적 import (Nuxt 4 자동 import 이슈 해결)
import CommentList from "~/components/comments/CommentList.vue";
import PasswordConfirmDialog from "~/components/ui/PasswordConfirmDialog.vue";

// 인증이 필요한 페이지는 Supabase redirectOptions에서 자동 처리

// 라우트 파라미터
const route = useRoute();
const postId = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id || "";

// 광고 관련 설정
const config = useRuntimeConfig()

// 게시글 하단 광고 표시 여부
const shouldShowPostAd = computed(() => {
  return config.public.adVisible !== 'false' && config.public.adPostDetailEnabled !== 'false'
})

// 게시글 하단 광고 URL
const postAdUrl = computed(() => {
  return config.public.coupangPostAdUrl || ''
})

if (!postId) {
  throw createError({
    statusCode: 404,
    statusMessage: "게시글을 찾을 수 없습니다.",
  });
}

// 댓글 리스트 참조
const commentListRef = ref();

// 페이지 메타 설정
useHead({
  title: "secret - 게시글 상세",
});

// usePost composable 사용
const {
  post,
  loading: pending,
  error,
  isLiked,
  displayLikeCount,
  likePending,
  aiSummaryGenerating,
  fetchPost,
  toggleLike,
  // setupRealtimeSubscription은 fetchPost에서 자동으로 호출됨
  // cleanupRealtimeSubscription은 onUnmounted에서 자동으로 호출됨
} = usePost(postId);

const refresh = fetchPost;

// usePostActions composable 사용
const {
  showDeleteModal,
  showPasswordModal: showEditPasswordModal,
  handleDelete,
  cancelDelete,
  goToEdit,
  handleEditPasswordConfirm,
  showDeleteConfirmation,
  cancelPasswordModal,
} = usePostActions(postId);

// 다이얼로그 참조
const deleteDialogRef = ref();
const editPasswordDialogRef = ref();

// 액션 핸들러들
const handleGoBack = () => {
  goBackToList();
};

const handleEdit = () => {
  goToEdit();
};

const handleDeleteRequest = () => {
  showDeleteConfirmation();
};

const handleDeleteConfirm = async (password: string) => {
  deleteDialogRef.value?.setLoading(true);

  try {
    await handleDelete(password);
  } catch (err: any) {
    // 다이얼로그에 에러 메시지 표시
    let errorMessage = "게시글 삭제에 실패했습니다.";

    // 비밀번호 오류인 경우 더 구체적인 메시지
    if (err.statusCode === 401 || err.statusMessage?.includes("비밀번호")) {
      errorMessage = "비밀번호가 일치하지 않습니다.";
    } else if (err.statusCode === 404) {
      errorMessage = "게시글을 찾을 수 없습니다.";
    } else if (err.data?.message) {
      errorMessage = err.data.message;
    }

    deleteDialogRef.value?.setError(errorMessage);
  }
};

const handleEditPasswordConfirmWithErrorHandling = async (password: string) => {
  editPasswordDialogRef.value?.setLoading(true);

  try {
    await handleEditPasswordConfirm(password);
  } catch (err: any) {
    // 다이얼로그에 에러 메시지 표시
    let errorMessage = "비밀번호 확인에 실패했습니다.";

    // 비밀번호 오류인 경우 더 구체적인 메시지
    if (err.statusCode === 401 || err.message?.includes("비밀번호")) {
      errorMessage = "비밀번호가 틀렸습니다. 다시 확인해주세요.";
    } else if (err.statusCode === 404) {
      errorMessage = "게시글을 찾을 수 없습니다.";
    } else if (err.data?.message) {
      errorMessage = err.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }

    editPasswordDialogRef.value?.setError(errorMessage);
  }
};

const cancelEdit = () => {
  cancelPasswordModal();
};

// 페이지 제목 동적 업데이트
watchEffect(() => {
  if (post.value?.title) {
    useHead({
      title: `${post.value.title} - secret`,
    });
  }
});

// 컴포넌트 마운트시 게시글 조회
onMounted(() => {
  fetchPost();
});

// 목록으로 돌아가기 (이전 페이지 상태 복원)
const goBackToList = () => {
  try {
    const { getStorageData } = useLocalStorage();
    const lastPage = getStorageData("board_last_page", 1);
    const lastParams = getStorageData("board_last_params", {
      sort: "",
      search: "",
    });

    // URL 파라미터 구성
    const searchParams = new URLSearchParams();
    if (lastPage && lastPage > 1) {
      searchParams.set("page", lastPage.toString());
    }
    if (lastParams.sort) {
      searchParams.set("sort", lastParams.sort);
    }
    if (lastParams.search) {
      searchParams.set("search", lastParams.search);
    }

    const queryString = searchParams.toString();
    const targetUrl = queryString ? `/?${queryString}` : "/";

    navigateTo(targetUrl);
  } catch (error) {
    console.error("목록 페이지 이동 실패:", error);
    navigateTo("/");
  }
};

// SEO 및 소셜 미디어 메타태그
// watchEffect(() => {
//   if (post.value) {
//     const description =
//       post.value.plain_text?.substring(0, 160) || "익명 게시판의 게시글입니다.";

//     useHead({
//       meta: [
//         { name: "description", content: description },
//         { property: "og:title", content: post.value.title },
//         { property: "og:description", content: description },
//         { property: "og:type", content: "article" },
//       ],
//     });
//   }
// });
</script>
