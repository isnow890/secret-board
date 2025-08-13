-- Supabase 데이터베이스 스키마
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- posts 테이블 생성
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- HTML 형태로 저장 (위지윅 에디터 출력)
  plain_text TEXT, -- 검색용 순수 텍스트
  password_hash VARCHAR(255) NOT NULL,
  attached_files JSONB DEFAULT '[]'::jsonb, -- 첨부파일 정보 저장
  view_count INTEGER DEFAULT 0, -- 조회수
  like_count INTEGER DEFAULT 0, -- 라이크 수
  comment_count INTEGER DEFAULT 0, -- 총 댓글 수 (대댓글 포함)
  last_comment_at TIMESTAMP DEFAULT NOW(), -- 마지막 댓글 작성 시간
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL
);

-- 커서 페이지네이션용 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_cursor_created ON posts(created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_posts_cursor_activity ON posts(last_comment_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_posts_cursor_likes ON posts(like_count DESC, id);
CREATE INDEX IF NOT EXISTS idx_posts_cursor_views ON posts(view_count DESC, id);

-- 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('korean', title || ' ' || plain_text));

-- comments 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL, -- 대댓글용
  content TEXT NOT NULL, -- 텍스트만 저장 (HTML 없음)
  plain_text TEXT, -- 검색용 순수 텍스트
  password_hash VARCHAR(255) NOT NULL,
  like_count INTEGER DEFAULT 0, -- 댓글 라이크 수
  depth INTEGER DEFAULT 0, -- 댓글 깊이 (0: 댓글, 1: 대댓글, 2: 대대댓글...)
  reply_count INTEGER DEFAULT 0, -- 직접 대댓글 개수
  path TEXT, -- 댓글 계층 경로 "1.2.3"
  is_author BOOLEAN DEFAULT FALSE, -- 글쓴이 여부 (게시글 작성자와 동일인 여부)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL
);

-- 댓글 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_post_path ON comments(post_id, path);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- 댓글 수 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 댓글 추가시
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET 
      comment_count = comment_count + 1,
      last_comment_at = NEW.created_at
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
  
  -- 댓글 삭제시
  IF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comment_count = comment_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 댓글 수 업데이트 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- 대댓글 수 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 대댓글 추가시
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_comment_id;
    RETURN NEW;
  END IF;
  
  -- 대댓글 삭제시
  IF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = reply_count - 1
    WHERE id = OLD.parent_comment_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 대댓글 수 업데이트 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_reply_count ON comments;
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reply_count();

-- RLS (Row Level Security) 비활성화 (익명 게시판이므로)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 테이블 소유자 권한 설정
GRANT ALL ON posts TO anon, authenticated;
GRANT ALL ON comments TO anon, authenticated;

-- 시퀀스 권한 설정
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Storage 버킷 생성을 위한 SQL (Supabase Dashboard에서 수동으로 설정 필요)
/*
다음 설정을 Supabase Dashboard Storage에서 수동으로 생성하세요:

1. 버킷명: post-images
   - Public: true
   - 파일 크기 제한: 10MB
   - 허용 MIME 타입: image/jpeg, image/png, image/gif, image/webp

2. 버킷명: post-files  
   - Public: true
   - 파일 크기 제한: 5MB
   - 허용 MIME 타입: 
     - application/pdf
     - application/msword
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - application/vnd.ms-excel
     - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     - text/plain
     - text/csv
     - application/zip
     - application/x-rar-compressed
     - application/x-7z-compressed
*/