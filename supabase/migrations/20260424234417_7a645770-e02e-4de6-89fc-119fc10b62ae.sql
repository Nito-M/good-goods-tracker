ALTER TABLE public.boards
ADD COLUMN IF NOT EXISTS header_frozen boolean NOT NULL DEFAULT true;