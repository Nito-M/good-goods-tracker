
CREATE POLICY "authed read job-instruction-files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'job-instruction-files');
CREATE POLICY "authed insert job-instruction-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-instruction-files');
CREATE POLICY "authed update job-instruction-files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'job-instruction-files') WITH CHECK (bucket_id = 'job-instruction-files');
CREATE POLICY "authed delete job-instruction-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'job-instruction-files');
