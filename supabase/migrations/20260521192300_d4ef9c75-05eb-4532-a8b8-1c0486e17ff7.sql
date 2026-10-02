ALTER TABLE public.board_cell_files
ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS caption text;

CREATE INDEX IF NOT EXISTS idx_board_cell_files_row_col_order
  ON public.board_cell_files (row_id, column_id, display_order);