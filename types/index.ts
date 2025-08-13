// types/index.ts - 중앙집중식 타입 재export
// 이 파일은 기존 import 경로 호환성을 위해 모든 도메인 타입들을 재export합니다.

// Post 도메인
export type {
  Post,
  PostSummary,
  CreatePostRequest,
  EditPostRequest,
  PostListRequest
} from './domains/post';

// Comment 도메인
export type {
  Comment,
  CreateCommentRequest,
  DeleteCommentRequest,
  DeleteCommentResponse,
  CommentLikeResponse,
  RecentComment
} from './domains/comment';

// Upload 도메인
export type {
  AttachedFile,
  UploadedFile,
  UploadingFile,
  UploadingImage
} from './domains/upload';

// API 도메인
export type {
  ApiResponse,
  PaginationInfo,
  ApiError,
  HttpMethod,
  RequestOptions
} from './domains/api';

// Auth 도메인
export type {
  AuthConfig,
  LocalStorageData,
  SessionInfo,
  PasswordVerifyRequest,
  PasswordVerifyResponse
} from './domains/auth';

// UI 도메인
export type {
  Toast,
  SimpleToast,
  BoardStats,
  ComponentSize,
  ButtonVariant,
  BaseButtonProps,
  InputType,
  BaseInputProps,
  SelectOption,
  NavigationItem,
  BasePaginationProps,
  ModalSize,
  BaseModalProps,
  UIState,
  TableColumn
} from './domains/ui';

// 공통 유틸리티 타입
export type {
  Optional,
  RequiredFields,
  Nullable,
  DeepPartial,
  DateString,
  Timestamp,
  UUID,
  ID,
  SortDirection,
  LoadingState,
  SubmitState,
  EventHandler,
  AsyncEventHandler,
  EnvironmentConfig,
  ApplicationError
} from './shared/common';

// 에디터 관련 공통 타입
export type {
  EditorInstance,
  TipTapEditor,
  EditorState,
  CodeBlockLanguage,
  LanguageDisplayMap,
  EditorConfig,
  EditorEvents
} from './shared/editor';

// Database 타입들 (기존 유지)
export type {
  Json,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes
} from './supabase';
