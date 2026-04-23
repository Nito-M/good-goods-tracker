ALTER TABLE public.board_columns ADD COLUMN IF NOT EXISTS text_align text NOT NULL DEFAULT 'left';
ALTER TABLE public.board_columns DROP CONSTRAINT IF EXISTS board_columns_text_align_check;
ALTER TABLE public.board_columns ADD CONSTRAINT board_columns_text_align_check CHECK (text_align IN ('left','center','right'));