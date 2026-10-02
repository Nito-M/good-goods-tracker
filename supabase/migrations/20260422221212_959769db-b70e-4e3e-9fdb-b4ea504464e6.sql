-- Activity log for board rows
CREATE TABLE public.board_row_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID NOT NULL REFERENCES public.board_rows(id) ON DELETE CASCADE,
  column_id UUID REFERENCES public.board_columns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'cell_changed' | 'row_created' | 'note_added' | 'note_deleted' | 'note_updated'
  column_name TEXT,
  column_type TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_row_activity_row_id ON public.board_row_activity(row_id, created_at DESC);

ALTER TABLE public.board_row_activity ENABLE ROW LEVEL SECURITY;

-- Reuse access pattern: a user can see/insert activity for rows on boards they can access
-- Boards table policies are user_id-based; mirror that.
CREATE POLICY "Users can view activity on accessible board rows"
ON public.board_row_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.board_rows br
    JOIN public.boards b ON b.id = br.board_id
    WHERE br.id = board_row_activity.row_id
      AND (
        b.user_id = auth.uid()
        OR (b.organization_id IS NOT NULL AND public.is_org_member(auth.uid(), b.organization_id))
      )
  )
);

CREATE POLICY "Users can insert activity on accessible board rows"
ON public.board_row_activity
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.board_rows br
    JOIN public.boards b ON b.id = br.board_id
    WHERE br.id = board_row_activity.row_id
      AND (
        b.user_id = auth.uid()
        OR (b.organization_id IS NOT NULL AND public.is_org_member(auth.uid(), b.organization_id))
      )
  )
);