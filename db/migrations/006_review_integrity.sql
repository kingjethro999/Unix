ALTER TABLE document_comments ADD COLUMN IF NOT EXISTS base_revision integer;
ALTER TABLE document_comments ADD COLUMN IF NOT EXISTS expected_text text;
ALTER TABLE document_comments ADD COLUMN IF NOT EXISTS suggestion_status text NOT NULL DEFAULT 'pending';
DO $$ BEGIN
  ALTER TABLE document_comments ADD CONSTRAINT document_comments_suggestion_status_check CHECK (suggestion_status IN ('pending','accepted','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
