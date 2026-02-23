
-- Add dxf_url column to inventory_items
ALTER TABLE public.inventory_items ADD COLUMN dxf_url text DEFAULT NULL;

-- Create dxf-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('dxf-files', 'dxf-files', false);

-- RLS policies for dxf-files bucket
CREATE POLICY "Users can upload their own dxf files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dxf-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own dxf files"
ON storage.objects FOR SELECT
USING (bucket_id = 'dxf-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own dxf files"
ON storage.objects FOR DELETE
USING (bucket_id = 'dxf-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Org members can view org dxf files"
ON storage.objects FOR SELECT
USING (bucket_id = 'dxf-files' AND EXISTS (
  SELECT 1 FROM public.inventory_items ii
  WHERE ii.user_id::text = (storage.foldername(name))[1]
  AND public.users_share_org(auth.uid(), ii.user_id)
));
