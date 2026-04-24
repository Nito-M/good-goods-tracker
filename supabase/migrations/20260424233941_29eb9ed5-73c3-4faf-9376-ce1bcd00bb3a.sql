ALTER TABLE public.board_rows
ADD COLUMN IF NOT EXISTS frozen boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_board_rows_board_frozen
ON public.board_rows (board_id, frozen, position);