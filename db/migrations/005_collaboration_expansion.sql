CREATE TABLE IF NOT EXISTS workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor', 'viewer')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspace_invitations_workspace_idx ON workspace_invitations(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wiki_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('character', 'location', 'organization', 'event', 'lore')),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  summary text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wiki_entries_workspace_idx ON wiki_entries(workspace_id, entry_type, name);
CREATE INDEX IF NOT EXISTS wiki_entries_search_idx ON wiki_entries USING gin (to_tsvector('simple', name || ' ' || summary || ' ' || details));

CREATE TABLE IF NOT EXISTS wiki_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_entry_id uuid NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
  target_entry_id uuid NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'related to',
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_entry_id, target_entry_id, relationship),
  CHECK(source_entry_id <> target_entry_id)
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS active_branch_id uuid REFERENCES document_branches(id) ON DELETE SET NULL;
