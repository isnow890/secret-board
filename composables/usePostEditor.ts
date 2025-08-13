/**
 * 게시글 수정 전용 컴포저블
 * 
 * 주요 기능:
 * - 게시글 수정 권한 인증 (sessionStorage 기반, 1시간 유효)
 * - 폼 상태 관리 및 유효성 검사
 * - 수정 사항 자동 감지 및 저장 경고
 * - 브라우저 마감/리로드 시 경고 처리
 * - 파일 업로드 에러 처리
 * 
 * @param postId 수정할 게시글 ID
 * @author Hit Secret Team
 */

import { ref, computed, onBeforeUnmount } from "vue";
import type { Post, EditPostRequest } from "~/types";

/**
 * 게시글 수정 컴포저블
 * @param postId 수정할 게시글의 ID
 */
export const usePostEditor = (postId: string) => {
  const router = useRouter();

  // === 인증 상태 관리 ===
  
  /** 수정 권한 인증 상태 */
  const isAuthenticated = ref(false);
  
  /** sessionStorage에 저장된 인증된 비밀번호 */
  const storedPassword = ref("");

  // === UI 상태 ===
  
  /** 비밀번호 확인 모달 표시 상태 */
  const showPasswordModal = ref(false);
  
  /** 비밀번호 대화상자 컴포넌트 참조 */
  const passwordDialogRef = ref();

  // === 폼 데이터 ===
  
  /** 게시글 수정 폼 데이터 */
  const form = ref<EditPostRequest>({
    title: "",
    content: "",
    nickname: "",
    password: "",
    attachedFiles: [],
  });

  // === 폼 상태 ===
  
  /** 폼 유효성 검사 에러 메시지 */
  const errors = ref<Partial<Record<keyof EditPostRequest, string>>>({});
  
  /** 폼 제출 중 상태 */
  const submitting = ref(false);
  
  /** 폼 제출 에러 메시지 */
  const submitError = ref("");

  // === 게시글 데이터 ===
  
  /** 원본 게시글 데이터 (변경 사항 감지용) */
  const originalPost = ref<Post | null>(null);

  // === 인증 처리 ===
  
  /**
   * sessionStorage에서 수정 권한 인증 상태를 확인
   * 1시간 이내 인증된 경우에만 인증 상태 유지
   * @returns 인증 여부
   */
  const checkAuthentication = (): boolean => {
    if (!process.client) return false;

    const authKey = `edit_auth_${postId}`;
    const authData = sessionStorage.getItem(authKey);

    if (authData) {
      try {
        const { password, timestamp } = JSON.parse(authData);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1시간

        // 1시간 이내인지 확인
        if (now - timestamp < oneHour) {
          storedPassword.value = password;
          isAuthenticated.value = true;
          return true;
        } else {
          // 만료된 인증 정보 삭제
          sessionStorage.removeItem(authKey);
        }
      } catch (error) {
        console.error("인증 데이터 파싱 실패:", error);
        sessionStorage.removeItem(authKey);
      }
    }

    return false;
  };

  /**
   * 비밀번호 확인 후 인증 상태 설정
   * 서버에 비밀번호 검증 요청 후 sessionStorage에 인증 정보 저장
   * @param password 사용자가 입력한 비밀번호
   */
  const handlePasswordConfirm = async (password: string): Promise<void> => {
    passwordDialogRef.value?.setLoading(true);

    try {
      const { verifyPostPassword } = usePost(postId);
      const isValid = await verifyPostPassword(password);

      if (isValid) {
        // 세션 스토리지에 인증 정보 저장 (1시간 유효)
        if (process.client) {
          const authKey = `edit_auth_${postId}`;
          const authData = {
            password,
            timestamp: Date.now(),
          };
          sessionStorage.setItem(authKey, JSON.stringify(authData));
        }

        storedPassword.value = password;
        isAuthenticated.value = true;
        showPasswordModal.value = false;

        // 게시글 데이터 로드 및 폼 초기화
        await loadPostAndInitializeForm();
      } else {
        passwordDialogRef.value?.setError("비밀번호가 틀렸습니다. 다시 확인해주세요.");
      }
    } catch (error: any) {
      console.error("비밀번호 확인 실패:", error);
      passwordDialogRef.value?.setError(
        "비밀번호 확인 중 오류가 발생했습니다."
      );
    }
  };

  /**
   * 게시글 데이터를 로드하고 폼을 초기화
   * 서버에서 게시글 데이터를 가져와 수정 폼에 반영
   */
  const loadPostAndInitializeForm = async (): Promise<void> => {
    try {
      const { fetchPost } = usePost(postId);
      const post = await fetchPost();

      if (post) {
        const postData = post as Post;
        originalPost.value = postData;
        form.value.title = postData.title;
        form.value.content = postData.content;
        form.value.attachedFiles = postData.attached_files || [];
      }
    } catch (error) {
      console.error("게시글 로드 실패:", error);
      useToast().add({
        title: "게시글 로드 실패",
        description: "게시글을 불러오는데 실패했습니다.",
        color: "red",
      });
    }
  };

  // === 폼 검증 ===
  
  /**
   * 폼 데이터 유효성 검사
   * 제목과 내용의 길이 제한을 검사
   * @returns 유효성 검사 통과 여부
   */
  const validateForm = (): boolean => {
    errors.value = {};

    const title = form.value.title.trim();
    const content = form.value.content.trim();

    if (title.length < 5) {
      errors.value.title = "제목은 5자 이상이어야 합니다.";
    } else if (title.length > 255) {
      errors.value.title = "제목은 255자 이하여야 합니다.";
    }

    if (content.length < 10) {
      errors.value.content = "내용은 10자 이상이어야 합니다.";
    } else if (content.length > 50000) {
      errors.value.content = "내용이 너무 깁니다. (최대 50,000자)";
    }

    return Object.keys(errors.value).length === 0;
  };

  // === 계산된 상태 ===
  
  /**
   * 폼의 유효성 상태 (실시간 계산)
   * 제목과 내용의 최소 조건을 만족하는지 확인
   */
  const isFormValid = computed(() => {
    return (
      form.value.title.trim().length >= 5 &&
      form.value.content.trim().length >= 10
    );
  });

  /**
   * 폼에 변경 사항이 있는지 확인 (브라우저 나가기 경고용)
   * 원본 게시글 데이터와 현재 폼 데이터를 비교
   */
  const isFormModified = computed(() => {
    if (!originalPost.value) return false;

    return (
      form.value.title !== originalPost.value.title ||
      form.value.content !== originalPost.value.content ||
      JSON.stringify(form.value.attachedFiles) !==
        JSON.stringify(originalPost.value.attached_files || [])
    );
  });

  // === 폼 제출 ===
  
  /**
   * 게시글 수정 제출 처리
   * 유효성 검사, 인증 확인 후 서버에 수정 요청 전송
   */
  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;
    if (!isAuthenticated.value || !storedPassword.value) {
      submitError.value = "인증이 필요합니다. 페이지를 새로고침해주세요.";
      return;
    }

    submitting.value = true;
    submitError.value = "";

    try {
      const { editPost } = usePost(postId);

      // 제목과 내용 트림 및 저장된 비밀번호 사용
      const submitData = {
        ...form.value,
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        password: storedPassword.value, // 인증된 비밀번호 사용
      };

      const updatedPost = await editPost(submitData);

      // 수정 완료 후 원본 데이터 업데이트 (변경사항 상태 초기화)
      if (updatedPost && originalPost.value) {
        originalPost.value = {
          ...originalPost.value,
          title: submitData.title,
          content: submitData.content,
          attached_files: submitData.attachedFiles || []
        };
      }

      // 수정 완료 후 인증 정보 삭제 및 게시글 상세 페이지로 이동
      if (process.client) {
        const authKey = `edit_auth_${postId}`;
        sessionStorage.removeItem(authKey);
      }

      await navigateTo(`/post/${postId}`);
    } catch (error: any) {
      console.error("게시글 수정 실패:", error);

      if (error.statusMessage) {
        submitError.value = error.statusMessage;
      } else if (error.data?.message) {
        submitError.value = error.data.message;
      } else if (error.message) {
        submitError.value = error.message;
      } else {
        submitError.value = "게시글 수정에 실패했습니다. 다시 시도해주세요.";
      }
    } finally {
      submitting.value = false;
    }
  };

  // === 에러 처리 ===
  
  /**
   * 파일 업로드 에러 처리
   * 에러 메시지를 사용자에게 토스트로 표시
   * @param error 에러 메시지
   */
  const handleUploadError = (error: string): void => {
    console.error("파일 업로드 오류:", error);
    useToast().add({
      title: "파일 업로드 오류",
      description: error,
      color: "red",
    });
  };

  // === 브라우저 이벤트 처리 ===
  
  /**
   * 브라우저 새로고침/닫기 시 경고 설정
   * 수정 사항이 있는 경우 브라우저 나가기 전 경고 메시지 표시
   */
  const setupBeforeUnloadWarning = (): void => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isFormModified.value && !submitting.value) {
        event.preventDefault();
        event.returnValue =
          "수정 중인 내용이 있습니다. 정말로 페이지를 나가시겠습니까?";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    onBeforeUnmount(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    });
  };

  /**
   * Vue Router 이동 시 경고 설정
   * 다른 페이지로 이동 시 수정 사항이 있으면 확인 대화상자 표시
   */
  const setupRouterGuard = (): void => {
    const removeGuard = router.beforeEach((to, from) => {
      // 현재 페이지가 게시글 수정 페이지이고, 다른 페이지로 이동하려는 경우
      if (from.path === `/post/${postId}/edit` && to.path !== from.path) {
        if (isFormModified.value && !submitting.value) {
          const confirmed = confirm(
            "수정 중인 내용이 있습니다. 정말로 페이지를 나가시겠습니까?"
          );
          if (!confirmed) {
            return false; // 이동을 취소
          }
        }
      }
    });

    onBeforeUnmount(() => {
      removeGuard(); // 라우터 가드 제거
    });
  };

  // === 초기화 ===
  
  /**
   * 컴포저블 초기화
   * 인증 상태 확인, 게시글 로드, 브라우저 경고 설정 수행
   */
  const initialize = async (): Promise<void> => {
    // 인증 상태 확인
    if (checkAuthentication()) {
      await loadPostAndInitializeForm();
    } else {
      // 인증되지 않은 경우 비밀번호 확인 모달 표시
      showPasswordModal.value = true;
    }

    // 브라우저 경고 설정
    setupBeforeUnloadWarning();
    setupRouterGuard();
  };

  return {
    // 상태
    isAuthenticated,
    showPasswordModal,
    passwordDialogRef,
    form,
    errors,
    submitting,
    submitError,
    isFormValid,
    isFormModified,

    // 메서드
    initialize,
    handlePasswordConfirm,
    validateForm,
    handleSubmit,
    handleUploadError,
  };
};
