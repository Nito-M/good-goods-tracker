
-- Add notes column to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes text;

-- Customer files (images & PDFs)
CREATE TABLE IF NOT EXISTS public.customer_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_files_customer ON public.customer_files(customer_id);

ALTER TABLE public.customer_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view customer files"
  ON public.customer_files FOR SELECT TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert their own customer files"
  ON public.customer_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org members can delete customer files"
  ON public.customer_files FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-files', 'customer-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own customer files (storage)"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Org members can read customer files (storage)"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'customer-files'
    AND public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can delete customer files (storage)"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'customer-files'
    AND public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
