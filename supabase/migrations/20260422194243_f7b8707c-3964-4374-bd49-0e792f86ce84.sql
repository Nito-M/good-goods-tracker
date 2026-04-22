
CREATE TABLE IF NOT EXISTS public.board_row_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id UUID NOT NULL UNIQUE REFERENCES public.board_rows(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.board_row_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view board row notes" ON public.board_row_notes;
CREATE POLICY "Org members can view board row notes"
ON public.board_row_notes FOR SELECT
TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can insert board row notes" ON public.board_row_notes;
CREATE POLICY "Org members can insert board row notes"
ON public.board_row_notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Org members can update board row notes" ON public.board_row_notes;
CREATE POLICY "Org members can update board row notes"
ON public.board_row_notes FOR UPDATE
TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can delete board row notes" ON public.board_row_notes;
CREATE POLICY "Org members can delete board row notes"
ON public.board_row_notes FOR DELETE
TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_board_row_notes_updated_at
BEFORE UPDATE ON public.board_row_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
