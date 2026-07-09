
CREATE POLICY "sop_files_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'sop-files' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
));
CREATE POLICY "sop_files_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'sop-files' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
));
CREATE POLICY "sop_files_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'sop-files' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
));
CREATE POLICY "sop_files_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'sop-files' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
));
