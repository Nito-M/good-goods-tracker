
CREATE TABLE IF NOT EXISTS public.so_item_nvis_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  quote_item_id uuid NOT NULL REFERENCES public.quote_items(id) ON DELETE CASCADE,
  unit_index integer NOT NULL DEFAULT 0,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_so_item_nvis_files_lookup ON public.so_item_nvis_files (quote_id, quote_item_id, unit_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.so_item_nvis_files TO authenticated;
GRANT ALL ON public.so_item_nvis_files TO service_role;

ALTER TABLE public.so_item_nvis_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own so_item_nvis_files" ON public.so_item_nvis_files
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_nvis_files.quote_id AND q.user_id = auth.uid()));

CREATE POLICY "Users insert own so_item_nvis_files" ON public.so_item_nvis_files
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_nvis_files.quote_id AND q.user_id = auth.uid()));

CREATE POLICY "Users update own so_item_nvis_files" ON public.so_item_nvis_files
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_nvis_files.quote_id AND q.user_id = auth.uid()));

CREATE POLICY "Users delete own so_item_nvis_files" ON public.so_item_nvis_files
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_nvis_files.quote_id AND q.user_id = auth.uid()));
