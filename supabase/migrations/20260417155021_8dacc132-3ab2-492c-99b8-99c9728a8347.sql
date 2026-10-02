CREATE POLICY "Org members can view org dxf files by folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'dxf-files'
  AND public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
);