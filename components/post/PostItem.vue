<!-- components/PostItem.vue -->
<template>
  <article
    class="flex items-start py-6 px-1 hover:bg-interactive-hover cursor-pointer transition-colors duration-150"
    @click="navigateToPost(post.id)"
  >
    <!-- 왼쪽 콘텐츠 -->
    <div class="flex-1 min-w-0">
      <!-- 제목과 NEW 배지 -->
      <div class="mb-1">
        <h3
          class="text-base md:text-lg font-medium line-clamp-2 inline transition-colors"
          :class="[
            post.is_deleted
              ? 'text-text-tertiary italic line-through'
              : isViewed
              ? 'text-text-tertiary hover:text-text-secondary'
              : 'text-text-primary hover:text-accent-blue',
          ]"
        >
          {{ post.is_deleted ? "삭제된 게시글입니다" : post.title }}
          <!-- NEW 배지 (3일 이내 발행, 삭제된 게시글이 아닐 때만) -->

          <UiNewBadge
            v-if="!post.is_deleted && isNewPost"
            variant="badge"
            size="xs"
            class="ml-1"
          />
        </h3>
      </div>

      <!-- 미리보기 텍스트 -->
      <p
        class="text-base mb-2 line-clamp-2 transition-colors"
        :class="[
          post.is_deleted
            ? 'text-text-quaternary italic line-through'
            : isViewed
            ? 'text-text-quaternary'
            : 'text-text-secondary',
        ]"
      >
        {{
          post.is_deleted
            ? "삭제된 게시글입니다."
            : post.preview || "내용이 없습니다."
        }}
      </p>

      <!-- 메타 정보 -->
      <div class="flex items-center text-xs text-text-tertiary space-x-3">
        <!-- 작성자 닉네임 -->
        <span class="flex items-center">
          <Icon name="lucide:user" class="w-3 h-3 mr-1" />
          {{ post.nickname || "익명" }}
        </span>
        <span class="flex items-center">
          <Icon name="lucide:eye" class="w-3 h-3 mr-1" />
          {{ formatNumber(post.view_count || 0) }}
        </span>
        <span class="flex items-center">
          <Icon name="lucide:heart" class="w-3 h-3 mr-1" />
          {{ formatNumber(post.like_count || 0) }}
        </span>
        <span class="flex items-center">
          <Icon name="lucide:message-circle" class="w-3 h-3 mr-1" />
          {{ formatNumber(post.comment_count || 0) }}
        </span>
        <span>{{ formatDate(post.created_at || "") }}</span>
      </div>

      <!-- 최근 댓글 시간 (있는 경우) -->
      <div
        v-if="
          (post.comment_count || 0) > 0 &&
          post.last_comment_at !== post.created_at
        "
        class="mt-1"
      >
        <span class="text-xs text-gray-400"
          >마지막 댓글 {{ formatDate(post.last_comment_at || "") }}</span
        >
      </div>
    </div>

    <!-- 오른쪽 썸네일 -->
    <div v-if="getFirstImage(post)" class="ml-4 flex-shrink-0">
      <NuxtImg
        :src="getFirstImage(post)!"
        :alt="post.title"
        class="w-16 h-16 object-cover rounded"
        loading="lazy"
        width="64"
        height="64"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PostSummary } from "~/types";

interface Props {
  post: PostSummary;
}

const props = defineProps<Props>();

// 읽은 글 상태 확인 (localStorage 기반)
const isViewed = ref(false);

const checkViewedStatus = () => {
  try {
    const { isPostViewed } = useLocalStorage();
    isViewed.value = isPostViewed(props.post.id);
  } catch (error) {
    console.error("읽은 글 상태 확인 실패:", error);
    isViewed.value = false;
  }
};

onMounted(() => {
  checkViewedStatus();

  // localStorage 변경사항 감지
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "board_viewed_posts") {
      checkViewedStatus();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  onBeforeUnmount(() => {
    window.removeEventListener("storage", handleStorageChange);
  });
});

const navigateToPost = (postId: string) => {
  // 현재 상태 저장 (페이지, 검색어, 정렬 옵션)
  saveCurrentState();
  navigateTo(`/post/${postId}`);
};

// 좋아요 처리
const handleLike = async () => {
  try {
    // 게시글 좋아요 API 호출 (구현 예정)
    console.log('게시글 좋아요:', props.post.id);
    
    // 실제 구현에서는 API 호출 후 좋아요 수 업데이트
    // const { $fetch } = useNuxtApp();
    // const result = await $fetch(`/api/posts/${props.post.id}/like`, {
    //   method: 'POST'
    // });
    
    // 임시로 로컬에서 카운트 증가 (실제로는 API 응답으로 처리)
    // props.post.like_count = (props.post.like_count || 0) + 1;
  } catch (error) {
    console.error('좋아요 처리 실패:', error);
  }
};

// 현재 상태 저장
const saveCurrentState = () => {
  try {
    const { setStorageData } = useLocalStorage();
    const route = useRoute();

    const currentPage = parseInt(route.query.page as string) || 1;
    const currentParams = {
      sort: (route.query.sort as string) || "",
      search: (route.query.search as string) || "",
    };

    setStorageData("board_last_page", currentPage);
    setStorageData("board_last_params", currentParams);
  } catch (error) {
    console.error("현재 상태 저장 실패:", error);
  }
};

// 첫 번째 이미지 가져오기
const getFirstImage = (post: PostSummary): string | null => {
  // 1. 첨부파일에서 이미지 찾기
  if (post.attached_files && post.attached_files.length > 0) {
    const imageFile = post.attached_files.find((file) => {
      const fileName = file.filename.toLowerCase();
      const fileType = file.type?.toLowerCase() || "";

      // 파일 타입으로 확인
      if (fileType.startsWith("image/")) return true;

      // 확장자로 확인
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
      ];
      return imageExtensions.some((ext) => fileName.endsWith(ext));
    });

    if (imageFile?.url) return imageFile.url;
  }

  // 2. 게시글 내용에서 img 태그 찾기
  if (post.content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, "text/html");
    const imgElement = doc.querySelector("img");

    if (imgElement && imgElement.src) {
      return imgElement.src;
    }
  }

  return null;
};

// useUtils composable에서 유틸리티 함수들 가져오기
const { formatNumber, formatDate } = useUtils();

// NEW 배지 표시 여부 (3일 이내 발행된 게시글, 삭제되지 않은 경우만)
const isNewPost = computed(() => {
  if (props.post.is_deleted || !props.post.created_at) return false;

  const postDate = new Date(props.post.created_at);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffInDays <= 3;
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
