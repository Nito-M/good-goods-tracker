
-- 1. Extend board_columns with type + options
ALTER TABLE public.board_columns
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.board_columns
  DROP CONSTRAINT IF EXISTS board_columns_type_check;
ALTER TABLE public.board_columns
  ADD CONSTRAINT board_columns_type_check
  CHECK (type IN ('text', 'date', 'checkbox', 'status', 'files'));

-- 2. board_cell_files table
CREATE TABLE IF NOT EXISTS public.board_cell_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id UUID NOT NULL REFERENCES public.board_rows(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_cell_files_row_col
  ON public.board_cell_files(row_id, column_id);

ALTER TABLE public.board_cell_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view board cell files" ON public.board_cell_files;
CREATE POLICY "Org members can view board cell files"
ON public.board_cell_files FOR SELECT
TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can insert board cell files" ON public.board_cell_files;
CREATE POLICY "Org members can insert board cell files"
ON public.board_cell_files FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Org members can delete board cell files" ON public.board_cell_files;
CREATE POLICY "Org members can delete board cell files"
ON public.board_cell_files FOR DELETE
TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

-- 3. Storage bucket for board files (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('board-files', 'board-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Org members can view board-files" ON storage.objects;
CREATE POLICY "Org members can view board-files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'board-files'
  AND public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Users can upload to board-files" ON storage.objects;
CREATE POLICY "Users can upload to board-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'board-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Org members can delete board-files" ON storage.objects;
CREATE POLICY "Org members can delete board-files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'board-files'
  AND public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
