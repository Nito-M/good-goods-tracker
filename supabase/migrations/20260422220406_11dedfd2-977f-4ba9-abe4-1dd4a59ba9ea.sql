
-- Create new table for multiple notes per board row, each with optional image
CREATE TABLE public.board_row_note_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID NOT NULL REFERENCES public.board_rows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_path TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_row_note_entries_row_id ON public.board_row_note_entries(row_id);

ALTER TABLE public.board_row_note_entries ENABLE ROW LEVEL SECURITY;

-- Users can view notes for rows in boards belonging to their organization
CREATE POLICY "Org members can view row note entries"
ON public.board_row_note_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.board_rows br
    JOIN public.boards b ON b.id = br.board_id
    WHERE br.id = board_row_note_entries.row_id
      AND (
        b.user_id = auth.uid()
        OR (
          b.organization_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = b.organization_id
              AND om.user_id = auth.uid()
          )
        )
      )
  )
);

CREATE POLICY "Org members can insert row note entries"
ON public.board_row_note_entries
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.board_rows br
    JOIN public.boards b ON b.id = br.board_id
    WHERE br.id = board_row_note_entries.row_id
      AND (
        b.user_id = auth.uid()
        OR (
          b.organization_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = b.organization_id
              AND om.user_id = auth.uid()
          )
        )
      )
  )
);

CREATE POLICY "Org members can update row note entries"
ON public.board_row_note_entries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.board_rows br
    JOIN public.boards b ON b.id = br.board_id
    WHERE br.id = board_row_note_entries.row_id
      AND (
        b.user_id = auth.uid()
        OR (
          b.organization_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = b.organization_id
              AND om.user_id = auth.uid()
          )
        )
      )
  )
);

CREATE POLICY "Org members can delete row note entries"
ON public.board_row_note_entries
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.board_rows br
    JOIN public.boards b ON b.id = br.board_id
    WHERE br.id = board_row_note_entries.row_id
      AND (
        b.user_id = auth.uid()
        OR (
          b.organization_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = b.organization_id
              AND om.user_id = auth.uid()
          )
        )
      )
  )
);

-- Migrate existing single notes (board_row_notes) into the new entries table
INSERT INTO public.board_row_note_entries (row_id, user_id, content, position, created_at, updated_at)
SELECT row_id, user_id, content, 0, created_at, updated_at
FROM public.board_row_notes
WHERE COALESCE(NULLIF(TRIM(content), ''), '') <> '';

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_board_row_note_entries_updated_at
BEFORE UPDATE ON public.board_row_note_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
