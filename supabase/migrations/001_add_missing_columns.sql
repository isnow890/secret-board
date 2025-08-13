-- 누락된 컬럼들을 posts 테이블에 추가
-- plain_text와 attached_files 컬럼 추가

DO $$
BEGIN
    -- plain_text 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'plain_text'
    ) THEN
        ALTER TABLE posts ADD COLUMN plain_text TEXT;
        COMMENT ON COLUMN posts.plain_text IS '검색용 순수 텍스트';
    END IF;

    -- attached_files 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'attached_files'
    ) THEN
        ALTER TABLE posts ADD COLUMN attached_files JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN posts.attached_files IS '첨부파일 정보 저장';
    END IF;
END $$;

-- 검색용 인덱스 생성 (이미 있으면 무시됨)
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('korean', title || ' ' || COALESCE(plain_text, '')));

-- 기존 게시글들의 plain_text 업데이트 (content에서 HTML 태그 제거)
UPDATE posts 
SET plain_text = regexp_replace(content, '<[^>]*>', '', 'g')
WHERE plain_text IS NULL AND content IS NOT NULL;