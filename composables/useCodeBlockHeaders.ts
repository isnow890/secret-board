import { nextTick } from "vue";
import type { EditorInstance } from "~/types/shared/editor";

/**
 * TipTap 코드블럭 헤더 관리 composable
 * 에디터와 뷰어에서 공통으로 사용되는 코드블럭 헤더 로직
 */
export const useCodeBlockHeaders = () => {
  // 언어 표시명 매핑
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
   * 언어 코드를 표시용 이름으로 변환
   */
  const getLanguageDisplay = (lang: string | null | undefined): string => {
    if (!lang) return "TEXT";
    return languageDisplayMap[lang] || lang.toUpperCase();
  };

  /**
   * 코드블럭 헤더 엘리먼트 생성 (Notion 스타일)
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
   * 개별 코드블럭에 헤더 첨부 (Notion 스타일 - absolute positioning)
   */
  const attachHeaderToBlock = (block: HTMLElement): void => {
    // DOM 구조: <pre class="editor-code-block"><code>...</code></pre>
    // block 자체가 pre 요소임
    const codeEl = block.querySelector("code");

    if (!codeEl) return;

    // 이미 헤더가 있으면 제거
    const existing = block.querySelector(".code-block-header");
    if (existing) existing.remove();

    // 언어 추출
    const lang =
      block.getAttribute("data-language") ||
      (codeEl.className.match(/language-(\w+)/) || [])[1] ||
      "";

    // 코드 내용 추출
    const codeText = codeEl.textContent || "";

    // 헤더 생성 및 추가 (absolute positioned이므로 위치 상관없이 추가)
    const header = buildCodeBlockHeader(codeText, lang);
    block.appendChild(header); // absolute positioned이므로 맨 마지막에 추가
  };

  /**
   * 에디터 DOM에서 모든 코드블럭 감지 및 헤더 추가
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
   * 복사 버튼 클릭 이벤트 핸들러 (전역 이벤트 위임)
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

        // 성공 피드백
        btn.innerHTML = `
          <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        `;

        // 1.5초 후 원래 아이콘으로 복구
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

    // 전역 이벤트 리스너 등록 (중복 방지)
    if (!document.body.dataset.copyHandlerSetup) {
      document.addEventListener("click", handleCopyClick);
      document.body.dataset.copyHandlerSetup = "true";
    }
  };

  /**
   * 코드블럭 감지 및 헤더 추가를 위한 편의 함수
   */
  const detectCodeBlocksWithDelay = (
    editor: EditorInstance,
    delay = 100
  ): void => {
    setTimeout(() => detectCodeBlocks(editor), delay);
  };

  return {
    // 핵심 함수들
    detectCodeBlocks,
    detectCodeBlocksWithDelay,
    getLanguageDisplay,
    buildCodeBlockHeader,
    attachHeaderToBlock,
    setupCopyButtonHandler,

    // 데이터
    languageDisplayMap,
  };
};
