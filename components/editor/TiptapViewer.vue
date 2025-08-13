<template>
  <div class="tiptap-viewer">
    <EditorContent
      :editor="editor"
      class="prose prose-lg max-w-none prose-invert"
    />
  </div>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { watch, onBeforeUnmount, nextTick, onMounted, ref } from "vue";
import { useTiptapCommon } from "~/composables/useTiptapCommon";
import { useCodeBlockHeaders } from "~/composables/useCodeBlockHeaders";
import lightGallery from "lightgallery";
import lgZoom from "lightgallery/plugins/zoom";
import lgThumbnail from "lightgallery/plugins/thumbnail";

// Import lightGallery CSS
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";

interface Props {
  content: string;
}

const props = defineProps<Props>();

// Use common TipTap settings
const { getCommonExtensions, getCommonEditorProps } = useTiptapCommon();

// Use code block headers composable
const { detectCodeBlocks, setupCopyButtonHandler } = useCodeBlockHeaders();

// LightGallery instance reference
const lightGalleryInstance = ref<any>(null);

// Initialize TipTap editor in read-only mode (viewer)
const editor = useEditor({
  content: props.content,
  editable: false, // 읽기 전용 모드
  extensions: getCommonExtensions(false), // false = viewer mode
  editorProps: getCommonEditorProps(false), // false = viewer mode
});

// Setup copy button handler for code blocks
setupCopyButtonHandler();

// Initialize lightGallery for images
const initLightGallery = () => {
  if (!editor.value) return;

  nextTick(() => {
    const editorElement = editor.value?.view.dom;
    if (!editorElement) return;

    // Destroy existing instance if it exists
    if (lightGalleryInstance.value) {
      lightGalleryInstance.value.destroy();
      lightGalleryInstance.value = null;
    }

    // Find all images in the editor content
    const images = editorElement.querySelectorAll("img");

    if (images.length > 0) {
      // Add lightgallery data attributes to images
      images.forEach((img: Element) => {
        const imgElement = img as HTMLImageElement;

        // Create a wrapper anchor for lightGallery if it doesn't exist
        if (!imgElement.parentElement?.matches("a[data-lg-item]")) {
          const wrapper = document.createElement("a");
          wrapper.setAttribute("data-lg-item", "");
          wrapper.setAttribute("data-src", imgElement.src);
          wrapper.setAttribute("data-lg-size", "1600-1200"); // Default size
          wrapper.style.cursor = "pointer";
          wrapper.style.display = "inline-block";

          // Replace img with wrapper containing img
          imgElement.parentNode?.insertBefore(wrapper, imgElement);
          wrapper.appendChild(imgElement);
        }
      });

      // Initialize lightGallery
      lightGalleryInstance.value = lightGallery(editorElement, {
        selector: "[data-lg-item]",
        plugins: [lgZoom, lgThumbnail],
        speed: 500,
        download: false,
        counter: true,
        thumbnail: true,
        zoom: true,
        zoomFromOrigin: false,
        actualSize: false,
        showZoomInOutIcons: true,
        actualSizeIcons: {
          zoomIn: "lg-zoom-in",
          zoomOut: "lg-zoom-out",
        },
      });
    }
  });
};

// detectCodeBlocks function now provided by useCodeBlockHeaders composable

// Watch for content changes
watch(
  () => props.content,
  (newContent) => {
    if (editor.value && newContent !== editor.value.getHTML()) {
      editor.value.commands.setContent(newContent);
      // Detect code blocks and initialize lightGallery after content update
      setTimeout(() => {
        if (editor.value) {
          detectCodeBlocks(editor.value);
        }
        initLightGallery();
      }, 100);
    }
  }
);

// Watch for editor initialization
watch(editor, (newEditor) => {
  if (newEditor) {
    // Detect code blocks and initialize lightGallery when editor is ready
    setTimeout(() => {
      detectCodeBlocks(newEditor);
      initLightGallery();
    }, 100);
  }
});

// Handle scroll and resize
const updateCodeBlockPositions = () => {
  if (editor.value) {
    detectCodeBlocks(editor.value);
  }
  initLightGallery();
};

onMounted(() => {
  // Initial detection
  setTimeout(() => {
    if (editor.value) {
      detectCodeBlocks(editor.value);
    }
    initLightGallery();
  }, 100);

  // Listen for scroll and resize events
  window.addEventListener("scroll", updateCodeBlockPositions);
  window.addEventListener("resize", updateCodeBlockPositions);
});

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }

  // Destroy lightGallery instance
  if (lightGalleryInstance.value) {
    lightGalleryInstance.value.destroy();
    lightGalleryInstance.value = null;
  }

  // Remove event listeners
  window.removeEventListener("scroll", updateCodeBlockPositions);
  window.removeEventListener("resize", updateCodeBlockPositions);
});
</script>

<style>
@import "~/assets/css/tiptap-editor.css";
</style>
