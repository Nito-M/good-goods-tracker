ALTER TABLE public.board_cells ADD COLUMN IF NOT EXISTS text_align text;
ALTER TABLE public.board_cells DROP CONSTRAINT IF EXISTS board_cells_text_align_check;
ALTER TABLE public.board_cells ADD CONSTRAINT board_cells_text_align_check CHECK (text_align IS NULL OR text_align IN ('left','center','right'));