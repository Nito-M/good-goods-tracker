
-- vendor_files
CREATE TABLE public.vendor_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_files TO authenticated;
GRANT ALL ON public.vendor_files TO service_role;
ALTER TABLE public.vendor_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view vendor files" ON public.vendor_files FOR SELECT USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own vendor files" ON public.vendor_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Org members can delete vendor files" ON public.vendor_files FOR DELETE USING (users_share_org(auth.uid(), user_id));
CREATE INDEX idx_vendor_files_vendor_id ON public.vendor_files(vendor_id);

-- vendor_links
CREATE TABLE public.vendor_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  label text,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_links TO authenticated;
GRANT ALL ON public.vendor_links TO service_role;
ALTER TABLE public.vendor_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view vendor links" ON public.vendor_links FOR SELECT USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own vendor links" ON public.vendor_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Org members can update vendor links" ON public.vendor_links FOR UPDATE USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete vendor links" ON public.vendor_links FOR DELETE USING (users_share_org(auth.uid(), user_id));
CREATE INDEX idx_vendor_links_vendor_id ON public.vendor_links(vendor_id);
CREATE TRIGGER trg_vendor_links_updated_at BEFORE UPDATE ON public.vendor_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for vendor-files bucket (path: {user_id}/{vendor_id}/{file}.ext)
CREATE POLICY "Org members can read vendor files (storage)" ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor-files' AND users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "Users can upload their own vendor files (storage)" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vendor-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Org members can delete vendor files (storage)" ON storage.objects FOR DELETE
  USING (bucket_id = 'vendor-files' AND users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid));
