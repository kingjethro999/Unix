-- 1. Create a secure function to check ownership without triggering RLS recursion
CREATE OR REPLACE FUNCTION check_folder_owner(p_folder_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER -- This bypasses RLS, avoiding the loop
SET search_path = public -- Secure search path
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM folders 
    WHERE id = p_folder_id 
    AND user_id = p_user_id
  );
END;
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Owners and participants see requests" ON share_requests;

-- 3. Re-create the policy using the clean function
CREATE POLICY "Owners and participants see requests" ON share_requests
  FOR ALL TO authenticated USING (
    auth.uid() = user_id OR -- requester (User checking their own request)
    check_folder_owner(folder_id, auth.uid()) -- folder owner (Owner checking requests for their folder)
  );


