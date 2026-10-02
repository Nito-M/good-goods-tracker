
-- Fix recursion between boards and board_member_access policies by using SECURITY DEFINER helpers

DROP POLICY IF EXISTS "Members with access can view boards" ON public.boards;
DROP POLICY IF EXISTS "View board access for accessible boards" ON public.board_member_access;
DROP POLICY IF EXISTS "Owner/admin manage board access - insert" ON public.board_member_access;
DROP POLICY IF EXISTS "Owner/admin manage board access - delete" ON public.board_member_access;
DROP POLICY IF EXISTS "View own + manageable column permissions" ON public.board_column_permissions;
DROP POLICY IF EXISTS "Owner/admin manage column permissions - insert" ON public.board_column_permissions;
DROP POLICY IF EXISTS "Owner/admin manage column permissions - update" ON public.board_column_permissions;
DROP POLICY IF EXISTS "Owner/admin manage column permissions - delete" ON public.board_column_permissions;

-- Helper to check if user is owner or org admin of a board (no recursion since SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_board_manager(_user_id uuid, _board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = _board_id
      AND (
        b.user_id = _user_id
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = _user_id
            AND om.role IN ('owner','admin')
        )
      )
  )
$$;

-- boards SELECT via SECURITY DEFINER helper (no nested table reference inside the policy expression)
CREATE POLICY "Members with access can view boards"
ON public.boards FOR SELECT
USING (public.has_board_access(auth.uid(), id));

-- board_member_access policies via helper
CREATE POLICY "View board access for accessible boards"
ON public.board_member_access FOR SELECT
USING (user_id = auth.uid() OR public.is_board_manager(auth.uid(), board_id));

CREATE POLICY "Owner/admin manage board access - insert"
ON public.board_member_access FOR INSERT
WITH CHECK (public.is_board_manager(auth.uid(), board_id));

CREATE POLICY "Owner/admin manage board access - delete"
ON public.board_member_access FOR DELETE
USING (public.is_board_manager(auth.uid(), board_id));

-- board_column_permissions policies via helper
CREATE POLICY "View own + manageable column permissions"
ON public.board_column_permissions FOR SELECT
USING (user_id = auth.uid() OR public.is_board_manager(auth.uid(), board_id));

CREATE POLICY "Owner/admin manage column permissions - insert"
ON public.board_column_permissions FOR INSERT
WITH CHECK (public.is_board_manager(auth.uid(), board_id));

CREATE POLICY "Owner/admin manage column permissions - update"
ON public.board_column_permissions FOR UPDATE
USING (public.is_board_manager(auth.uid(), board_id));

CREATE POLICY "Owner/admin manage column permissions - delete"
ON public.board_column_permissions FOR DELETE
USING (public.is_board_manager(auth.uid(), board_id));
