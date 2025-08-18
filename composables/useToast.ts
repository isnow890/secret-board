import { ref, readonly } from "vue";
import type { Toast } from "~/types";

/**
 * @description 전역 Toast 알림 목록
 * @type {import('vue').Ref<Toast[]>}
 */
const toasts = ref<Toast[]>([]);

/**
 * @description 애플리케이션 전역에서 Toast 알림을 관리하는 컴포저블입니다.
 */
export const useToast = () => {
  /**
   * @description 새로운 Toast 알림을 추가합니다. ID는 자동으로 생성됩니다.
   * @param {Omit<Toast, "id">} toast - ID가 생략된 Toast 객체
   */
  const add = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    let variant: Toast['variant'] = 'info'; // 기본값을 info로 변경
    if (toast.color === 'red') variant = 'error';
    else if (toast.color === 'green') variant = 'success';
    else if (toast.variant) variant = toast.variant;
    
    const newToast: Toast = {
      id,
      variant,
      timeout: 3000,
      ...toast,
    };

    toasts.value.push(newToast);

    if (newToast.timeout && newToast.timeout > 0) {
      setTimeout(() => {
        remove(id);
      }, newToast.timeout);
    }
  };

  /**
   * @description ID를 사용하여 특정 Toast 알림을 제거합니다.
   * @param {string} id - 제거할 Toast의 ID
   */
  const remove = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  /**
   * @description 현재 표시된 모든 Toast 알림을 제거합니다.
   */
  const clear = () => {
    toasts.value = [];
  };

  return {
    /** 현재 활성화된 Toast 목록 (읽기 전용) */
    toasts: readonly(toasts),
    /** 새 Toast 추가 */
    add,
    /** 특정 Toast 제거 */
    remove,
    /** 모든 Toast 제거 */
    clear,
  };
};
