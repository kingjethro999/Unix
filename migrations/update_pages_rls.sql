-- Pages: Owner Access
CREATE POLICY "Owners have full access to pages" ON pages
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Pages: Shared Access (View)
CREATE POLICY "Shared pages access" ON pages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM folder_share_settings WHERE folder_id = pages.folder_id AND status = 'anyone_with_link') OR
    EXISTS (SELECT 1 FROM share_requests WHERE folder_id = pages.folder_id AND user_id = auth.uid() AND status = 'approved')
  );

-- Share Requests: Owner/Requester Access
CREATE POLICY "Owners and participants see requests" ON share_requests
  FOR ALL TO authenticated USING (
    auth.uid() = user_id OR -- requester
    EXISTS (SELECT 1 FROM folders WHERE id = folder_id AND user_id = auth.uid()) -- folder owner
  );
