// composables/useToast.ts
import { ref, readonly } from "vue";

interface Toast {
  id: string;
  title: string;
  description?: string;
  color?: "red" | "gray" | "blue" | "green"; // Optional with default gray
  variant?: "default" | "success" | "warning" | "error" | "info"; // UiAlert variant
  timeout?: number;
}

const toasts = ref<Toast[]>([]);

export const useToast = () => {
  const add = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Map legacy color to variant
    let variant: Toast['variant'] = 'default';
    if (toast.color === 'red') variant = 'error';
    else if (toast.color === 'green') variant = 'success';
    else if (toast.color === 'blue') variant = 'info';
    else if (toast.variant) variant = toast.variant;
    
    const newToast = {
      id,
      color: "gray" as const,
      variant,
      timeout: 3000,
      ...toast,
    };

    toasts.value.push(newToast);

    // 자동으로 제거
    if (newToast.timeout && newToast.timeout > 0) {
      setTimeout(() => {
        remove(id);
      }, newToast.timeout);
    }
  };

  const remove = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clear = () => {
    toasts.value = [];
  };

  return {
    toasts: readonly(toasts),
    add,
    remove,
    clear,
  };
};
