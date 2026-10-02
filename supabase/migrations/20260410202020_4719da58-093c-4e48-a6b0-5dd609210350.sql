
INSERT INTO storage.buckets (id, name, public) VALUES ('trailer-images', 'trailer-images', false);

CREATE POLICY "Users can upload trailer images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trailer-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view trailer images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'trailer-images');

CREATE POLICY "Users can update their trailer images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'trailer-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their trailer images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'trailer-images' AND auth.uid()::text = (storage.foldername(name))[1]);
