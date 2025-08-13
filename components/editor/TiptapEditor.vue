<template>
  <div class="tiptap-editor-container">
    <!-- Toolbar -->
    <div v-if="editor" class="tiptap-toolbar">
      <!-- Text Formatting -->
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        type="button"
        class="toolbar-btn"
        title="Bold"
      >
        <Icon name="lucide:bold" class="w-4 h-4" />
      </button>

      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        type="button"
        class="toolbar-btn"
        title="Italic"
      >
        <Icon name="lucide:italic" class="w-4 h-4" />
      </button>

      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        type="button"
        class="toolbar-btn"
        title="Strikethrough"
      >
        <Icon name="lucide:strikethrough" class="w-4 h-4" />
      </button>

      <div class="toolbar-divider"></div>

      <!-- Headers -->
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        type="button"
        class="toolbar-btn"
        title="Heading 1"
      >
        H1
      </button>

      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        type="button"
        class="toolbar-btn"
        title="Heading 2"
      >
        H2
      </button>

      <button
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        type="button"
        class="toolbar-btn"
        title="Heading 3"
      >
        H3
      </button>

      <div class="toolbar-divider"></div>

      <!-- Lists -->
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        type="button"
        class="toolbar-btn"
        title="Bullet List"
      >
        <Icon name="lucide:list" class="w-4 h-4" />
      </button>

      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        type="button"
        class="toolbar-btn"
        title="Ordered List"
      >
        <Icon name="lucide:list-ordered" class="w-4 h-4" />
      </button>

      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': editor.isActive('blockquote') }"
        type="button"
        class="toolbar-btn"
        title="Blockquote"
      >
        <Icon name="lucide:quote" class="w-4 h-4" />
      </button>

      <div class="toolbar-divider"></div>

      <!-- Media -->
      <button
        @click.prevent="triggerImageUpload"
        type="button"
        class="toolbar-btn"
        title="Upload Image"
      >
        <Icon name="lucide:image" class="w-4 h-4" />
      </button>

      <button
        @click.prevent="addYouTubeVideo"
        type="button"
        class="toolbar-btn"
        title="Add YouTube Video"
      >
        <Icon name="lucide:play" class="w-4 h-4" />
      </button>

      <button
        @click="toggleCodeBlock"
        :class="{ 'is-active': editor.isActive('codeBlock') }"
        type="button"
        class="toolbar-btn"
        title="Code Block"
      >
        <Icon name="lucide:code" class="w-4 h-4" />
      </button>

      <!-- Language selector for code blocks -->
      <select
        v-if="editor.isActive('codeBlock')"
        @change="
          setCodeBlockLanguage(($event.target as HTMLSelectElement).value)
        "
        class="toolbar-select"
        title="Select Language"
      >
        <option
          v-for="lang in availableLanguages"
          :key="lang.value"
          :value="lang.value"
          :selected="editor.getAttributes('codeBlock').language === lang.value"
        >
          {{ lang.label }}
        </option>
      </select>

      <div class="toolbar-divider"></div>

      <!-- Undo/Redo -->
      <button
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        type="button"
        class="toolbar-btn"
        title="Undo"
      >
        <Icon name="lucide:undo-2" class="w-4 h-4" />
      </button>

      <button
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        type="button"
        class="toolbar-btn"
        title="Redo"
      >
        <Icon name="lucide:redo-2" class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor Content -->
    <TiptapEditorContent :editor="editor" class="tiptap-editor-content" />

    <!-- Image Upload Progress -->
    <div v-if="uploadingImages.length > 0" class="upload-progress-container">
      <div
        v-for="upload in uploadingImages"
        :key="upload.id"
        class="upload-progress-item"
      >
        <div class="upload-info">
          <Icon name="lucide:image" class="w-4 h-4 text-accent-blue" />
          <span class="upload-filename">{{ upload.name }}</span>
          <span class="upload-percentage">{{ upload.progress }}%</span>
        </div>
        <div class="upload-progress-bar">
          <div
            class="upload-progress-fill"
            :style="{ width: `${upload.progress}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      @change="handleFileSelect"
      class="hidden"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string;
  placeholder?: string;
  readonly?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "내용을 입력하세요...",
  readonly: false,
});

const emit = defineEmits<Emits>();

// File input reference
const fileInput = ref<HTMLInputElement>();

// Use the image upload composable
const { uploadingImages, processImageFile, uploading } = useImageUpload();

// Use common TipTap settings
const { getCommonExtensions, getCommonEditorProps } = useTiptapCommon();

// Use code block headers composable
const { detectCodeBlocksWithDelay, setupCopyButtonHandler } =
  useCodeBlockHeaders();

// Initialize Tiptap editor
const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: getCommonExtensions(true), // true = editable mode
  onUpdate: ({ editor }) => {
    const content = editor.getHTML();
    emit("update:modelValue", content);
    emit("change", content);

    // Detect code blocks after content update
    detectCodeBlocksWithDelay(editor);
  },
  editorProps: {
    ...getCommonEditorProps(true),
    handleKeyDown: (view, event) => {
      // Handle Tab key - always insert 2 spaces instead of tab character
      if (event.key === 'Tab') {
        const { state } = view;
        const { selection } = state;
        
        event.preventDefault();
        
        // Insert 2 spaces at cursor position
        const tr = state.tr;
        tr.insertText('  ', selection.from, selection.to);
        view.dispatch(tr);
        return true;
      }
      
      return false;
    },
    handlePaste: (view, event) => {
      // Handle image paste
      const items = event.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.indexOf("image") !== -1) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file);
            }
            return true;
          }
        }
      }
      return false;
    },
    handleDrop: (view, event, slice, moved) => {
      if (moved) return false;

      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        event.preventDefault();
        for (const file of files) {
          if (file.type.startsWith("image/")) {
            handleImageUpload(file);
          }
        }
        return true;
      }
      return false;
    },
  },
});

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getHTML() !== newValue) {
      editor.value.commands.setContent(newValue || "", false);
    }
  }
);

watch(
  () => props.readonly,
  (readonly) => {
    if (editor.value) {
      editor.value.setEditable(!readonly);
    }
  }
);

// Image upload functions
const triggerImageUpload = () => {
  // Prevent multiple simultaneous triggers
  if (uploading.value) return;
  
  try {
    fileInput.value?.click();
  } catch (error) {
    console.error('Failed to trigger file input:', error);
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (files) {
    for (const file of files) {
      handleImageUpload(file);
    }
  }
  // Reset input
  input.value = "";
};

const handleImageUpload = async (file: File) => {
  try {
    await processImageFile(file, (url: string) => {
      // Insert image at current cursor position and move to next line
      if (editor.value) {
        editor.value
          .chain()
          .focus()
          .setImage({
            src: url,
            alt: file.name,
            title: file.name, // 마우스 오버시 프롬프트 표시
          })
          .createParagraphNear()
          .focus()
          .run();

        // Add resizable-image class after insertion
        nextTick(() => {
          if (editor.value) {
            const editorElement = editor.value.view.dom;
            const images = editorElement.querySelectorAll('img[src="' + url + '"]');
            console.log('Found images for resizable class:', images.length);
            images.forEach((img) => {
              img.classList.add('resizable-image');
              console.log('Added resizable-image class to:', img);
            });
            
            // Manually setup handlers if not already done
            setTimeout(() => {
              setupImageHandlers();
            }, 100);
          }
        });
      }
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    // Error handling is done in the composable
  }
};

// Image resize functionality
const selectedImage = ref<HTMLImageElement | null>(null);
const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const originalWidth = ref(0);
const originalHeight = ref(0);

// Setup image click handlers when editor is ready
watch(editor, (newEditor) => {
  if (newEditor) {
    nextTick(() => {
      setupImageHandlers();
    });
  }
}, { immediate: true });

// Track if handlers are already set up to prevent duplicates
const handlersSetup = ref(false);

const setupImageHandlers = () => {
  if (!editor.value) {
    console.log('Editor not available for image handlers setup');
    return;
  }
  
  if (handlersSetup.value) {
    console.log('Image handlers already set up');
    return;
  }

  console.log('Setting up image handlers');
  const editorElement = editor.value.view.dom;

  // Add click event listener for images
  editorElement.addEventListener("click", handleImageClick);

  // Add global mouse events for resizing
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  // Add scroll event to update handle positions
  window.addEventListener("scroll", updateHandlePositions);
  window.addEventListener("resize", updateHandlePositions);

  // Add global click to deselect image when clicking outside
  document.addEventListener("click", handleGlobalClick);
  
  handlersSetup.value = true;
  console.log('Image handlers setup completed');
};

const handleImageClick = (event: Event) => {
  const target = event.target as HTMLElement;
  console.log('Image click detected:', target.tagName, target.classList.toString());

  if (
    target.tagName === "IMG" &&
    target.classList.contains("resizable-image")
  ) {
    console.log('Selecting resizable image');
    event.preventDefault();
    selectImage(target as HTMLImageElement);
  } else {
    console.log('Deselecting image or not a resizable image');
    deselectImage();
  }
};

const selectImage = (img: HTMLImageElement) => {
  console.log('Selecting image:', img);
  // Remove previous selection
  deselectImage();

  selectedImage.value = img;
  img.classList.add("selected-image");
  console.log('Added selected-image class');

  // Create resize handles
  console.log('Creating resize handles...');
  createResizeHandles(img);
};

const deselectImage = () => {
  if (selectedImage.value) {
    selectedImage.value.classList.remove("selected-image");
    selectedImage.value = null;
  }

  // Remove all resize handles
  document.querySelectorAll(".resize-handle").forEach((handle) => {
    handle.remove();
  });
};

const createResizeHandles = (img: HTMLImageElement) => {
  console.log('Creating resize handles for image:', img);
  const handles = ["nw", "ne", "sw", "se"];

  handles.forEach((position) => {
    console.log('Creating handle:', position);
    const handle = document.createElement("div");
    handle.className = `resize-handle resize-${position}`;
    handle.addEventListener("mousedown", (e) => startResize(e, position));

    // Position handle relative to image
    const rect = img.getBoundingClientRect();
    console.log('Image rect:', rect);
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    handle.style.position = "absolute";
    handle.style.width = "12px";
    handle.style.height = "12px";
    handle.style.backgroundColor = "#3b82f6";
    handle.style.border = "2px solid white";
    handle.style.borderRadius = "50%";
    handle.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    handle.style.zIndex = "9999";
    handle.style.transition = "transform 0.1s";
    handle.style.pointerEvents = "auto";

    // Set cursor based on position
    const cursors = {
      nw: "nw-resize",
      ne: "ne-resize",
      sw: "sw-resize",
      se: "se-resize",
    };
    handle.style.cursor = cursors[position as keyof typeof cursors];

    // Hover effect
    handle.addEventListener("mouseenter", () => {
      handle.style.transform = "scale(1.2)";
    });
    handle.addEventListener("mouseleave", () => {
      handle.style.transform = "scale(1)";
    });

    switch (position) {
      case "nw":
        handle.style.top = rect.top + scrollTop - 6 + "px";
        handle.style.left = rect.left + scrollLeft - 6 + "px";
        break;
      case "ne":
        handle.style.top = rect.top + scrollTop - 6 + "px";
        handle.style.left = rect.right + scrollLeft - 6 + "px";
        break;
      case "sw":
        handle.style.top = rect.bottom + scrollTop - 6 + "px";
        handle.style.left = rect.left + scrollLeft - 6 + "px";
        break;
      case "se":
        handle.style.top = rect.bottom + scrollTop - 6 + "px";
        handle.style.left = rect.right + scrollLeft - 6 + "px";
        break;
    }

    document.body.appendChild(handle);
    console.log('Added handle to body:', handle, 'at position:', handle.style.top, handle.style.left);
  });
  
  console.log('Finished creating all resize handles');
};

const startResize = (event: MouseEvent, position: string) => {
  if (!selectedImage.value) return;

  event.preventDefault();
  isResizing.value = true;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;

  const img = selectedImage.value;
  originalWidth.value = img.offsetWidth;
  originalHeight.value = img.offsetHeight;

  // Store resize position
  img.dataset.resizePosition = position;
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isResizing.value || !selectedImage.value) return;

  const img = selectedImage.value;
  const position = img.dataset.resizePosition;

  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;

  let newWidth = originalWidth.value;
  let newHeight = originalHeight.value;

  // Calculate new dimensions based on resize position
  if (position?.includes("e")) {
    newWidth = originalWidth.value + deltaX;
  } else if (position?.includes("w")) {
    newWidth = originalWidth.value - deltaX;
  }

  // Maintain aspect ratio
  const aspectRatio = originalWidth.value / originalHeight.value;
  newHeight = newWidth / aspectRatio;

  // Apply minimum and maximum constraints
  newWidth = Math.max(50, Math.min(800, newWidth));
  newHeight = newWidth / aspectRatio;

  // Update image size
  img.style.width = newWidth + "px";
  img.style.height = newHeight + "px";

  // Update resize handles position
  document.querySelectorAll(".resize-handle").forEach((handle) => {
    handle.remove();
  });
  createResizeHandles(img);
};

const handleMouseUp = () => {
  if (isResizing.value && selectedImage.value) {
    isResizing.value = false;

    const img = selectedImage.value;
    const newWidth = img.style.width;
    const newHeight = img.style.height;
    
    console.log('Mouse up - saving image size:', { newWidth, newHeight });

    // Update TipTap's image node with the new dimensions
    if (editor.value && newWidth && newHeight) {
      // Find the image position in the editor
      const pos = findImagePosition(img);
      if (pos !== null) {
        console.log('Found image position:', pos);
        
        // Update the image node attributes
        editor.value
          .chain()
          .focus()
          .setNodeSelection(pos)
          .updateAttributes('image', {
            style: `width: ${newWidth}; height: ${newHeight};`,
            width: newWidth.replace('px', ''),
            height: newHeight.replace('px', '')
          })
          .run();

        console.log('Updated image attributes via TipTap');

        // Emit the changes
        nextTick(() => {
          if (editor.value) {
            const content = editor.value.getHTML();
            console.log('Final content after resize:', content);
            emit("update:modelValue", content);
            emit("change", content);
          }
        });
      }
    }
  }
};

// Helper function to find image position in TipTap
const findImagePosition = (imgElement: HTMLImageElement): number | null => {
  if (!editor.value) return null;
  
  const { state } = editor.value;
  let imagePos: number | null = null;
  
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs.src === imgElement.src) {
      imagePos = pos;
      return false; // Stop traversing
    }
  });
  
  return imagePos;
};

const updateHandlePositions = () => {
  if (selectedImage.value) {
    // Remove existing handles and recreate them at new positions
    document.querySelectorAll(".resize-handle").forEach((handle) => {
      handle.remove();
    });
    createResizeHandles(selectedImage.value);
  }
};

const handleGlobalClick = (event: Event) => {
  const target = event.target as HTMLElement;

  // Don't deselect if clicking on resize handles or the selected image
  if (
    target.classList.contains("resize-handle") ||
    target === selectedImage.value ||
    target.closest(".tiptap-editor-container")
  ) {
    return;
  }

  deselectImage();
};

// YouTube functionality
const addYouTubeVideo = () => {
  const url = prompt(
    "YouTube URL을 입력하세요:",
    "https://www.youtube.com/watch?v="
  );

  if (url && editor.value) {
    try {
      editor.value
        .chain()
        .focus()
        .setYoutubeVideo({
          src: url,
          width: 640,
          height: 480,
        })
        .createParagraphNear()
        .focus()
        .run();
    } catch (error) {
      console.error("YouTube 비디오 추가 실패:", error);
      alert("YouTube 비디오를 추가할 수 없습니다.");
    }
  }
};

// Code block functionality
const toggleCodeBlock = () => {
  if (editor.value) {
    editor.value.chain().focus().toggleCodeBlock().run();
    detectCodeBlocksWithDelay(editor.value);
  }
};

const setCodeBlockLanguage = (language: string) => {
  if (editor.value && editor.value.isActive("codeBlock")) {
    editor.value
      .chain()
      .focus()
      .updateAttributes("codeBlock", { language })
      .run();
    detectCodeBlocksWithDelay(editor.value);
  }
};

// Available programming languages from common composable
const { availableLanguages } = useTiptapCommon();

// Setup copy button handler for code blocks
setupCopyButtonHandler();

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    unref(editor.value).destroy();
  }

  // Remove global event listeners
  if (handlersSetup.value) {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("click", handleGlobalClick);
    window.removeEventListener("scroll", updateHandlePositions);
    window.removeEventListener("resize", updateHandlePositions);
    
    // Reset handler setup flag
    handlersSetup.value = false;
  }

  // Remove resize handles
  deselectImage();
});
</script>

<style>
@import "~/assets/css/tiptap-editor.css";
</style>
