// composables/useTiptapCommon.ts
import TiptapStarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Youtube from "@tiptap/extension-youtube";
import { lowlight } from "lowlight";

// Import common languages for syntax highlighting
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import csharp from "highlight.js/lib/languages/csharp";
import dart from "highlight.js/lib/languages/dart";
import nginx from "highlight.js/lib/languages/nginx";

// 언어 등록
lowlight.registerLanguage("html", xml);
lowlight.registerLanguage("xml", xml);
lowlight.registerLanguage("css", css);
lowlight.registerLanguage("js", javascript);
lowlight.registerLanguage("javascript", javascript);
lowlight.registerLanguage("ts", typescript);
lowlight.registerLanguage("typescript", typescript);
lowlight.registerLanguage("python", python);
lowlight.registerLanguage("java", java);
lowlight.registerLanguage("json", json);
lowlight.registerLanguage("sql", sql);
lowlight.registerLanguage("bash", bash);
lowlight.registerLanguage("sh", bash);
lowlight.registerLanguage("csharp", csharp);
lowlight.registerLanguage("cs", csharp);
lowlight.registerLanguage("dart", dart);
lowlight.registerLanguage("flutter", dart);
lowlight.registerLanguage("nginx", nginx);

/**
 * TipTap 에디터와 뷰어가 공통으로 사용하는 설정 및 기능
 */
export const useTiptapCommon = () => {
  // 공통 extensions 설정
  const getCommonExtensions = (isEditable = false) => {
    const extensions = [
      TiptapStarterKit.configure({
        // Disable the default CodeBlock to use our enhanced version
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
        HTMLAttributes: {
          class: "editor-code-block",
        },
      }).extend({
        addKeyboardShortcuts() {
          return {
            // 안드로이드에서 코드 블록 내 엔터키 처리 개선
            Enter: ({ editor }) => {
              const { state } = editor;
              const { $from } = state.selection;

              // 코드 블록 내부에서만 작동
              if ($from.parent.type.name === "codeBlock") {
                // 안드로이드 환경 감지
                const isAndroid =
                  /Android/.test(navigator.userAgent) ||
                  ("ontouchstart" in window &&
                    /Mobile/.test(navigator.userAgent));

                if (isAndroid) {
                  // 안드로이드에서는 수동으로 줄바꿈 처리
                  const tr = state.tr.insertText(
                    "\n",
                    state.selection.from,
                    state.selection.to
                  );
                  editor.view.dispatch(tr);
                  return true;
                }
              }

              // 다른 환경에서는 기본 동작 사용
              return false;
            },

            // Shift+Enter로 코드 블록 나가기 (모든 환경)
            "Shift-Enter": ({ editor }) => {
              const { state } = editor;
              const { $from } = state.selection;

              if ($from.parent.type.name === "codeBlock") {
                // 코드 블록을 나가고 새 문단 시작
                return editor.commands.exitCode();
              }

              return false;
            },
          };
        },
      }),
      TiptapImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: isEditable ? "editor-image resizable-image" : "editor-image",
        },
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            title: {
              default: null,
              parseHTML: (element) => element.getAttribute("title"),
              renderHTML: (attributes) => {
                if (!attributes.title) {
                  return {};
                }
                return {
                  title: attributes.title,
                };
              },
            },
            width: {
              default: null,
              parseHTML: (element) => element.getAttribute("width"),
              renderHTML: (attributes) => {
                if (!attributes.width) {
                  return {};
                }
                return {
                  width: attributes.width,
                };
              },
            },
            height: {
              default: null,
              parseHTML: (element) => element.getAttribute("height"),
              renderHTML: (attributes) => {
                if (!attributes.height) {
                  return {};
                }
                return {
                  height: attributes.height,
                };
              },
            },
            style: {
              default: null,
              parseHTML: (element) => element.getAttribute("style"),
              renderHTML: (attributes) => {
                if (!attributes.style) {
                  return {};
                }
                return {
                  style: attributes.style,
                };
              },
            },
            class: {
              default: isEditable
                ? "editor-image resizable-image"
                : "editor-image",
              parseHTML: (element) => element.getAttribute("class"),
              renderHTML: (attributes) => {
                return {
                  class:
                    attributes.class ||
                    (isEditable
                      ? "editor-image resizable-image"
                      : "editor-image"),
                };
              },
            },
          };
        },
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        controls: true,
        nocookie: false,
        allowFullscreen: true,
        autoplay: false,
        HTMLAttributes: {
          class: "editor-youtube",
        },
      }),
    ];

    // Tab 키 기능은 에디터 컴포넌트에서 직접 처리

    return extensions;
  };

  // 사용 가능한 프로그래밍 언어 목록
  const availableLanguages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "csharp", label: "C#" },
    { value: "dart", label: "Dart/Flutter" },
    { value: "css", label: "CSS" },
    { value: "html", label: "HTML" },
    { value: "json", label: "JSON" },
    { value: "sql", label: "SQL" },
    { value: "bash", label: "Bash" },
    { value: "sh", label: "Shell" },
    { value: "nginx", label: "Nginx" },
  ];

  // 공통 에디터 속성
  const getCommonEditorProps = (isEditable = false) => {
    const baseClass =
      "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none";

    if (!isEditable) {
      return {
        attributes: {
          class: baseClass,
        },
      };
    }

    return {
      attributes: {
        class: baseClass,
      },
      handlePaste: (view: any, event: ClipboardEvent) => {
        // Handle image paste (에디터 전용)
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                // 이미지 처리 로직은 에디터에서 별도 구현
                return true;
              }
            }
          }
        }
        return false;
      },
      handleDrop: (view: any, event: DragEvent, slice: any, moved: boolean) => {
        if (moved) return false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          for (const file of files) {
            if (file.type.startsWith("image/")) {
              // 이미지 처리 로직은 에디터에서 별도 구현
            }
          }
          return true;
        }
        return false;
      },
    };
  };

  return {
    getCommonExtensions,
    availableLanguages,
    getCommonEditorProps,
    lowlight,
  };
};
