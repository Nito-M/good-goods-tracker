ALTER TABLE public.board_columns
ADD COLUMN IF NOT EXISTS per_row_options boolean NOT NULL DEFAULT false;