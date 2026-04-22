-- Boards table
CREATE TABLE public.boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  group_by_column_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Board columns
CREATE TABLE public.board_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Column',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Board rows
CREATE TABLE public.board_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Board cells
CREATE TABLE public.board_cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id UUID NOT NULL REFERENCES public.board_rows(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (row_id, column_id)
);

CREATE INDEX idx_board_columns_board_id ON public.board_columns(board_id);
CREATE INDEX idx_board_rows_board_id ON public.board_rows(board_id);
CREATE INDEX idx_board_cells_row_id ON public.board_cells(row_id);
CREATE INDEX idx_board_cells_column_id ON public.board_cells(column_id);

-- Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_cells ENABLE ROW LEVEL SECURITY;

-- BOARDS policies
CREATE POLICY "Org members can view boards"
ON public.boards FOR SELECT
USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can create their own boards"
ON public.boards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org members can update boards"
ON public.boards FOR UPDATE
USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can delete boards"
ON public.boards FOR DELETE
USING (public.users_share_org(auth.uid(), user_id));

-- BOARD_COLUMNS policies
CREATE POLICY "Org members can view board columns"
ON public.board_columns FOR SELECT
USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

CREATE POLICY "Org members can insert board columns"
ON public.board_columns FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

CREATE POLICY "Org members can update board columns"
ON public.board_columns FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

CREATE POLICY "Org members can delete board columns"
ON public.board_columns FOR DELETE
USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

-- BOARD_ROWS policies
CREATE POLICY "Org members can view board rows"
ON public.board_rows FOR SELECT
USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

CREATE POLICY "Org members can insert board rows"
ON public.board_rows FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

CREATE POLICY "Org members can update board rows"
ON public.board_rows FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

CREATE POLICY "Org members can delete board rows"
ON public.board_rows FOR DELETE
USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.users_share_org(auth.uid(), b.user_id)));

-- BOARD_CELLS policies
CREATE POLICY "Org members can view board cells"
ON public.board_cells FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.board_rows r
  JOIN public.boards b ON b.id = r.board_id
  WHERE r.id = row_id AND public.users_share_org(auth.uid(), b.user_id)
));

CREATE POLICY "Org members can insert board cells"
ON public.board_cells FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.board_rows r
  JOIN public.boards b ON b.id = r.board_id
  WHERE r.id = row_id AND public.users_share_org(auth.uid(), b.user_id)
));

CREATE POLICY "Org members can update board cells"
ON public.board_cells FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.board_rows r
  JOIN public.boards b ON b.id = r.board_id
  WHERE r.id = row_id AND public.users_share_org(auth.uid(), b.user_id)
));

CREATE POLICY "Org members can delete board cells"
ON public.board_cells FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.board_rows r
  JOIN public.boards b ON b.id = r.board_id
  WHERE r.id = row_id AND public.users_share_org(auth.uid(), b.user_id)
));

-- Triggers for updated_at
CREATE TRIGGER update_boards_updated_at
BEFORE UPDATE ON public.boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_rows_updated_at
BEFORE UPDATE ON public.board_rows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_cells_updated_at
BEFORE UPDATE ON public.board_cells
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();