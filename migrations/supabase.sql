-- ==========================================
-- 1. EXTENSIONS & TYPES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- Added from plan/18.md

-- Custom Types for Unix Logic
CREATE TYPE share_status AS ENUM ('no_one', 'anyone_with_link', 'approval_required');
CREATE TYPE access_level AS ENUM ('view', 'edit');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- ==========================================
-- 2. TABLES
-- ==========================================

-- Folders: Supports nested directories
CREATE TABLE folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages: Metadata for the writing files
CREATE TABLE pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Untitled',
  is_pinned BOOLEAN DEFAULT FALSE,
  last_edited TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content: The actual text (JSON for TipTap, Text for Gemini)
-- Note: embedding column added via ALTER TABLE below or here. 
-- Keeping strictly to plan/17.md structure for this table, will alter later or add now.
-- merging plan/18.md addition here for cleaner schema
CREATE TABLE content (
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE PRIMARY KEY,
  body_json JSONB DEFAULT '{}'::jsonb,
  body_text TEXT DEFAULT '',
  embedding vector(768), -- Added from plan/18.md
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Settings: Link-based permissions
CREATE TABLE folder_share_settings (
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE PRIMARY KEY,
  status share_status DEFAULT 'no_one',
  share_token UUID DEFAULT uuid_generate_v4() UNIQUE,
  default_access access_level DEFAULT 'view',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Requests: The approval-based system
CREATE TABLE share_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status DEFAULT 'pending',
  granted_access access_level DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(folder_id, user_id)
);

-- ==========================================
-- 3. REALTIME CONFIGURATION
-- ==========================================
-- Enable Realtime for live collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE folders, pages, content, share_requests;

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_requests ENABLE ROW LEVEL SECURITY;

-- Folders: Owner Access
CREATE POLICY "Owners have full access to folders" ON folders
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Folders: Shared Access (View)
CREATE POLICY "Access folders via link or approval" ON folders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM folder_share_settings WHERE folder_id = id AND status = 'anyone_with_link') OR
    EXISTS (SELECT 1 FROM share_requests WHERE folder_id = id AND user_id = auth.uid() AND status = 'approved')
  );

-- Content: Owner Access
CREATE POLICY "Owners have full access to content" ON content
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM pages WHERE id = page_id AND user_id = auth.uid())
  );

-- Content: Shared Access (View/Edit)
CREATE POLICY "Shared content access" ON content
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM folder_share_settings fss JOIN pages p ON p.folder_id = fss.folder_id WHERE p.id = page_id AND fss.status = 'anyone_with_link') OR
    EXISTS (SELECT 1 FROM share_requests sr JOIN pages p ON p.folder_id = sr.folder_id WHERE p.id = page_id AND sr.user_id = auth.uid() AND sr.status = 'approved')
  );

CREATE POLICY "Shared content edit" ON content
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM folder_share_settings fss JOIN pages p ON p.folder_id = fss.folder_id WHERE p.id = page_id AND fss.status = 'anyone_with_link' AND fss.default_access = 'edit') OR
    EXISTS (SELECT 1 FROM share_requests sr JOIN pages p ON p.folder_id = sr.folder_id WHERE p.id = page_id AND sr.user_id = auth.uid() AND sr.status = 'approved' AND sr.granted_access = 'edit')
  );


-- ==========================================
-- 5. AUTOMATIC CONTENT INITIALIZATION
-- ==========================================
-- Trigger to create a content row whenever a page is created
CREATE OR REPLACE FUNCTION handle_new_page()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.content (page_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_page_created
  AFTER INSERT ON public.pages
  FOR EACH ROW EXECUTE FUNCTION handle_new_page();

-- ==========================================
-- 6. VECTOR SEARCH (From plan/18.md)
-- ==========================================
-- Create an index for lightning-fast searching
CREATE INDEX ON content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- SQL Search Function
CREATE OR REPLACE FUNCTION match_unix_pages (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  page_id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    c.body_text,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM content c
  JOIN pages p ON p.id = c.page_id
  WHERE p.user_id = p_user_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
