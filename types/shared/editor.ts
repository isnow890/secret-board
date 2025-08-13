// types/shared/editor.ts
import type { Editor } from "@tiptap/vue-3";

// Editor 타입 정의 (코어와 vue-3 호환)
export type EditorInstance = {
  view: {
    dom: Element | null;
  };
} | null;

// TipTap Editor 확장 타입
export type TipTapEditor = Editor | null;

// 에디터 상태 타입
export type EditorState = 'idle' | 'loading' | 'ready' | 'error';

// 코드 블록 언어 타입
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

// 언어 매핑 타입
export type LanguageDisplayMap = Record<string, string>;

// 에디터 설정
export interface EditorConfig {
  placeholder?: string;
  editable?: boolean;
  autofocus?: boolean;
  spellcheck?: boolean;
  enableCodeBlocks?: boolean;
  enableImageUpload?: boolean;
}

// 에디터 이벤트
export interface EditorEvents {
  onUpdate?: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onCreate?: (editor: TipTapEditor) => void;
  onDestroy?: () => void;
}