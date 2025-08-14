import { nextTick } from "vue";
import type { EditorInstance } from "~/types/shared/editor";

/**
 * @description Tiptap 에디터의 코드 블록에 Notion 스타일의 헤더(언어 표시, 복사 버튼)를 추가하고 관리하는 컴포저블입니다.
 * 에디터와 뷰어에서 공통으로 사용됩니다.
 */
export const useCodeBlockHeaders = () => {
  /**
   * @description 프로그래밍 언어 코드와 사용자에게 보여질 이름을 매핑하는 객체
   * @type {Record<string, string>}
   */
  const languageDisplayMap: Record<string, string> = {
    js: "JavaScript",
    ts: "TypeScript",
    python: "Python",
    java: "Java",
    cs: "C#",
    dart: "Dart",
    flutter: "Flutter",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    sql: "SQL",
    bash: "Bash",
    sh: "Shell",
    nginx: "Nginx",
  };

  /**
   * @description 언어 코드를 화면에 표시할 이름으로 변환합니다. 매핑에 없으면 대문자로 변환하여 반환합니다.
   * @param {string | null | undefined} lang - 변환할 언어 코드 (e.g., 'js')
   * @returns {string} 표시용 언어 이름 (e.g., 'JavaScript')
   */
  const getLanguageDisplay = (lang: string | null | undefined): string => {
    if (!lang) return "TEXT";
    return languageDisplayMap[lang] || lang.toUpperCase();
  };

  /**
   * @description 코드 블록에 추가될 헤더 DOM 요소를 생성합니다.
   * @param {string} code - 복사할 코드 내용
   * @param {string} lang - 코드의 프로그래밍 언어
   * @returns {HTMLElement} 생성된 헤더 요소
   */
  const buildCodeBlockHeader = (code: string, lang: string): HTMLElement => {
    const header = document.createElement("div");
    header.className = "code-block-header";
    header.innerHTML = `
      <span class="code-language">${getLanguageDisplay(lang)}</span>
      <button class="copy-button" type="button" title="복사" data-content="${encodeURIComponent(
        code
      )}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    `;
    return header;
  };

  /**
   * @description 특정 코드 블록(`<pre>`) 요소에 헤더를 첨부합니다.
   * @param {HTMLElement} block - 헤더를 추가할 `<pre>` 요소
   */
  const attachHeaderToBlock = (block: HTMLElement): void => {
    const codeEl = block.querySelector("code");
    if (!codeEl) return;

    const existing = block.querySelector(".code-block-header");
    if (existing) existing.remove();

    const lang =
      block.getAttribute("data-language") ||
      (codeEl.className.match(/language-(\w+)/) || [])[1] ||
      "";

    const codeText = codeEl.textContent || "";
    const header = buildCodeBlockHeader(codeText, lang);
    block.appendChild(header);
  };

  /**
   * @description 에디터 DOM 내의 모든 코드 블록을 찾아 헤더를 추가합니다.
   * @param {EditorInstance} editor - Tiptap 에디터 인스턴스
   */
  const detectCodeBlocks = (editor: EditorInstance): void => {
    if (!editor) return;

    nextTick(() => {
      const dom = editor.view.dom;
      if (!dom) return;

      const blocks = dom.querySelectorAll(".editor-code-block");
      blocks.forEach((block: Element) => attachHeaderToBlock(block as HTMLElement));
    });
  };

  /**
   * @description 코드 블록 헤더의 복사 버튼에 대한 전역 클릭 이벤트 핸들러를 설정합니다.
   * 이벤트 위임을 사용하여 한 번만 등록됩니다.
   */
  const setupCopyButtonHandler = (): void => {
    const handleCopyClick = async (e: Event) => {
      const target = e.target as HTMLElement;
      const btn = target.closest(".copy-button") as HTMLButtonElement | null;

      if (!btn) return;

      const encoded = btn.getAttribute("data-content") || "";
      const content = decodeURIComponent(encoded);

      try {
        await navigator.clipboard.writeText(content);

        btn.innerHTML = `
          <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        `;

        setTimeout(() => {
          btn.innerHTML = `
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          `;
        }, 1500);
      } catch (err) {
        console.error("코드 복사 실패:", err);
      }
    };

    if (!document.body.dataset.copyHandlerSetup) {
      document.addEventListener("click", handleCopyClick);
      document.body.dataset.copyHandlerSetup = "true";
    }
  };

  /**
   * @description 렌더링 지연을 고려하여 코드 블록 감지 및 헤더 추가를 실행합니다.
   * @param {EditorInstance} editor - Tiptap 에디터 인스턴스
   * @param {number} [delay=100] - 실행 지연 시간 (ms)
   */
  const detectCodeBlocksWithDelay = (
    editor: EditorInstance,
    delay = 100
  ): void => {
    setTimeout(() => detectCodeBlocks(editor), delay);
  };

  return {
    detectCodeBlocks,
    detectCodeBlocksWithDelay,
    getLanguageDisplay,
    buildCodeBlockHeader,
    attachHeaderToBlock,
    setupCopyButtonHandler,
    languageDisplayMap,
  };
};
