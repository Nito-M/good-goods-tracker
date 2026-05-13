ALTER TABLE public.board_columns DROP CONSTRAINT IF EXISTS board_columns_type_check;
ALTER TABLE public.board_columns ADD CONSTRAINT board_columns_type_check
  CHECK (type = ANY (ARRAY['text'::text, 'date'::text, 'checkbox'::text, 'status'::text, 'files'::text, 'link'::text, 'connect'::text, 'price'::text, 'item'::text]));