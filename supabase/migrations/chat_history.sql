-- ==========================================
-- CHAT HISTORY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own chat history
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own messages (and the system will effectively insert as them via server client in this specific architecture context, or we rely on service role key in API)
-- For the client-side fetches, we need SELECT.
-- For the API route (server-side), we will bypass RLS or ensure context is set. Since we used createsServerClient with cookies, it acts as the user.
CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Explicitly allow deletion if ever needed (e.g. clear history)
CREATE POLICY "Users can delete own chat messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);
