-- Recreate boards INSERT policy explicitly scoped to authenticated role.
-- Also ensure the post-insert SELECT works by allowing the owner to immediately
-- read their newly created board (has_board_access already covers this, but
-- we add a defensive check by ensuring the policy is unambiguous).

DROP POLICY IF EXISTS "Users can create their own boards" ON public.boards;

CREATE POLICY "Users can create their own boards"
ON public.boards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
