-- Drop all existing SELECT policies for our buckets to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own quote attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own request images" ON storage.objects;

-- Recreate owner-only SELECT policies (PO files policy was already created)
CREATE POLICY "Users can view their own quote attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own request images"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-images' AND auth.uid()::text = (storage.foldername(name))[1]);