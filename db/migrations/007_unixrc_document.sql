ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'manuscript';
DO $$ BEGIN
  ALTER TABLE documents ADD CONSTRAINT documents_document_type_check CHECK (document_type IN ('manuscript','unixrc'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS documents_one_unixrc_per_workspace ON documents(workspace_id) WHERE document_type='unixrc';

INSERT INTO documents (workspace_id, owner_id, title, document_type, content_json, content_text)
SELECT w.id, w.owner_id, '.unixrc', 'unixrc',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Rules"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Write clearly and preserve the author’s voice."}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Focused rules"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Add a focused rule here."}]}]}]}]}'::jsonb,
  '## Rules\nWrite clearly and preserve the author’s voice.\n\n## Focused rules\nAdd a focused rule here.'
FROM workspaces w WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.workspace_id=w.id AND d.document_type='unixrc');
