CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_conversations_user_workspace_idx ON chat_conversations(workspace_id, user_id, updated_at DESC);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE;

-- Keep existing chat history visible after introducing separate conversations.
-- Each prior workspace history becomes one clearly named conversation for its owner.
WITH created AS (
  INSERT INTO chat_conversations (workspace_id, user_id, title)
  SELECT workspace_id, user_id, 'Earlier assistant history'
  FROM chat_messages
  WHERE conversation_id IS NULL
  GROUP BY workspace_id, user_id
  RETURNING id, workspace_id, user_id
)
UPDATE chat_messages AS message
SET conversation_id = created.id
FROM created
WHERE message.conversation_id IS NULL
  AND message.workspace_id = created.workspace_id
  AND message.user_id = created.user_id;

CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages(conversation_id, created_at);
