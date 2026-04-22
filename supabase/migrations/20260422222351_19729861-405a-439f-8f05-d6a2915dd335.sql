
-- ============================================================================
-- Board permissions: per-user board access + per-column visibility/edit rights
-- ============================================================================

-- 1) board_member_access: presence of row = user can see this board
CREATE TABLE public.board_member_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, user_id)
);

CREATE INDEX idx_board_member_access_user ON public.board_member_access(user_id);
CREATE INDEX idx_board_member_access_board ON public.board_member_access(board_id);

-- 2) board_column_permissions: per-user column permission override
CREATE TABLE public.board_column_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'edit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (column_id, user_id),
  CONSTRAINT valid_permission CHECK (permission IN ('edit', 'view', 'hidden'))
);

CREATE INDEX idx_board_column_permissions_user ON public.board_column_permissions(user_id);
CREATE INDEX idx_board_column_permissions_board ON public.board_column_permissions(board_id);

-- 3) Helper: has_board_access (SECURITY DEFINER, avoids recursion)
CREATE OR REPLACE FUNCTION public.has_board_access(_user_id uuid, _board_id uuid)
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
            AND om.role IN ('owner', 'admin')
        )
        OR EXISTS (
          SELECT 1 FROM public.board_member_access bma
          WHERE bma.board_id = _board_id AND bma.user_id = _user_id
        )
      )
  )
$$;

-- 4) Helper: column permission for current user (returns 'edit' by default)
CREATE OR REPLACE FUNCTION public.get_column_permission(_user_id uuid, _column_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      -- Owner / org admin always have edit
      SELECT 'edit'
      FROM public.board_columns bc
      JOIN public.boards b ON b.id = bc.board_id
      WHERE bc.id = _column_id
        AND (
          b.user_id = _user_id
          OR EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = b.organization_id
              AND om.user_id = _user_id
              AND om.role IN ('owner', 'admin')
          )
        )
      LIMIT 1
    ),
    (
      SELECT bcp.permission
      FROM public.board_column_permissions bcp
      WHERE bcp.column_id = _column_id AND bcp.user_id = _user_id
      LIMIT 1
    ),
    'edit'
  )
$$;

-- 5) Enable RLS
ALTER TABLE public.board_member_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_column_permissions ENABLE ROW LEVEL SECURITY;

-- 6) RLS for board_member_access
CREATE POLICY "View board access for accessible boards"
ON public.board_member_access
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      )
  )
);

CREATE POLICY "Owner/admin manage board access - insert"
ON public.board_member_access
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      )
  )
);

CREATE POLICY "Owner/admin manage board access - delete"
ON public.board_member_access
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      )
  )
);

-- 7) RLS for board_column_permissions
CREATE POLICY "View own + manageable column permissions"
ON public.board_column_permissions
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      )
  )
);

CREATE POLICY "Owner/admin manage column permissions - insert"
ON public.board_column_permissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      )
  )
);

CREATE POLICY "Owner/admin manage column permissions - update"
ON public.board_column_permissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      )
  )
);

CREATE POLICY "Owner/admin manage column permissions - delete"
ON public.board_column_permissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      )
  )
);

-- 8) Replace boards SELECT policy to honor board_member_access
DROP POLICY IF EXISTS "Org members can view boards" ON public.boards;
CREATE POLICY "Members with access can view boards"
ON public.boards
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = boards.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.board_member_access bma
    WHERE bma.board_id = boards.id AND bma.user_id = auth.uid()
  )
);

-- 9) Replace board_columns policies: respect 'hidden' for SELECT, 'view'/'hidden' for UPDATE
DROP POLICY IF EXISTS "Org members can view board columns" ON public.board_columns;
DROP POLICY IF EXISTS "Org members can update board columns" ON public.board_columns;

CREATE POLICY "Members can view non-hidden board columns"
ON public.board_columns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_columns.board_id
      AND users_share_org(auth.uid(), b.user_id)
      AND public.has_board_access(auth.uid(), b.id)
  )
  AND public.get_column_permission(auth.uid(), board_columns.id) <> 'hidden'
);

CREATE POLICY "Members with edit can update board columns"
ON public.board_columns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_columns.board_id
      AND users_share_org(auth.uid(), b.user_id)
      AND public.has_board_access(auth.uid(), b.id)
  )
  AND public.get_column_permission(auth.uid(), board_columns.id) = 'edit'
);

-- 10) Replace board_cells policies: respect column permission
DROP POLICY IF EXISTS "Org members can view board cells" ON public.board_cells;
DROP POLICY IF EXISTS "Org members can update board cells" ON public.board_cells;
DROP POLICY IF EXISTS "Org members can insert board cells" ON public.board_cells;
DROP POLICY IF EXISTS "Org members can delete board cells" ON public.board_cells;

CREATE POLICY "Members view cells of visible columns"
ON public.board_cells
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.board_rows r
    JOIN public.boards b ON b.id = r.board_id
    WHERE r.id = board_cells.row_id
      AND users_share_org(auth.uid(), b.user_id)
      AND public.has_board_access(auth.uid(), b.id)
  )
  AND public.get_column_permission(auth.uid(), board_cells.column_id) <> 'hidden'
);

CREATE POLICY "Members with edit can insert cells"
ON public.board_cells
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.board_rows r
    JOIN public.boards b ON b.id = r.board_id
    WHERE r.id = board_cells.row_id
      AND users_share_org(auth.uid(), b.user_id)
      AND public.has_board_access(auth.uid(), b.id)
  )
  AND public.get_column_permission(auth.uid(), board_cells.column_id) = 'edit'
);

CREATE POLICY "Members with edit can update cells"
ON public.board_cells
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.board_rows r
    JOIN public.boards b ON b.id = r.board_id
    WHERE r.id = board_cells.row_id
      AND users_share_org(auth.uid(), b.user_id)
      AND public.has_board_access(auth.uid(), b.id)
  )
  AND public.get_column_permission(auth.uid(), board_cells.column_id) = 'edit'
);

CREATE POLICY "Members with edit can delete cells"
ON public.board_cells
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.board_rows r
    JOIN public.boards b ON b.id = r.board_id
    WHERE r.id = board_cells.row_id
      AND users_share_org(auth.uid(), b.user_id)
      AND public.has_board_access(auth.uid(), b.id)
  )
  AND public.get_column_permission(auth.uid(), board_cells.column_id) = 'edit'
);

-- 11) Backfill: grant access to every org member of every existing board
INSERT INTO public.board_member_access (board_id, user_id)
SELECT DISTINCT b.id, om.user_id
FROM public.boards b
JOIN public.organization_members om ON om.organization_id = b.organization_id
ON CONFLICT (board_id, user_id) DO NOTHING;

-- Also grant to the board creator (in case they're not in an org or above missed them)
INSERT INTO public.board_member_access (board_id, user_id)
SELECT b.id, b.user_id FROM public.boards b
ON CONFLICT (board_id, user_id) DO NOTHING;
