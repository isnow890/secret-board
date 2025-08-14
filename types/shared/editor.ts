// types/shared/editor.ts
import type { Editor } from "@tiptap/vue-3";

/**
 * @description Tiptap 에디터의 핵심 인스턴스 타입을 간소화하여 정의
 */
export type EditorInstance = {
  view: {
    dom: Element | null;
  };
} | null;

/**
 * @description @tiptap/vue-3의 Editor 인스턴스 또는 null을 나타내는 타입
 */
export type TipTapEditor = Editor | null;

/**
 * @description 에디터의 생명주기 상태를 나타내는 타입
 */
export type EditorState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * @description 코드 블록에서 지원하는 프로그래밍 언어 타입을 정의
 */
export type CodeBlockLanguage = 
  | 'javascript' | 'js'
  | 'typescript' | 'ts'
  | 'python' | 'py'
  | 'java'
  | 'csharp' | 'cs'
  | 'dart'
  | 'flutter'
  | 'css'
  | 'html'
  | 'json'
  | 'sql'
  | 'bash' | 'sh'
  | 'nginx'
  | string; // 확장 가능

/**
 * @description 언어 코드와 표시 이름을 매핑하는 객체 타입
 */
export type LanguageDisplayMap = Record<string, string>;

/**
 * @description Tiptap 에디터의 초기 설정을 정의하는 인터페이스
 */
export interface EditorConfig {
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 편집 가능 여부 */
  editable?: boolean;
  /** 자동 포커스 여부 */
  autofocus?: boolean;
  /** 맞춤법 검사 사용 여부 */
  spellcheck?: boolean;
  /** 코드 블록 기능 활성화 여부 */
  enableCodeBlocks?: boolean;
  /** 이미지 업로드 기능 활성화 여부 */
  enableImageUpload?: boolean;
}

/**
 * @description 에디터에서 발생하는 이벤트를 처리하는 콜백 함수들의 인터페이스
 */
export interface EditorEvents {
  /** 내용이 업데이트될 때 호출되는 콜백 */
  onUpdate?: (content: string) => void;
  /** 에디터가 포커스를 얻었을 때 호출되는 콜백 */
  onFocus?: () => void;
  /** 에디터가 포커스를 잃었을 때 호출되는 콜백 */
  onBlur?: () => void;
  /** 에디터가 생성되었을 때 호출되는 콜백 */
  onCreate?: (editor: TipTapEditor) => void;
  /** 에디터가 파괴될 때 호출되는 콜백 */
  onDestroy?: () => void;
}