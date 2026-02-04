-- Create storage bucket for quote attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-attachments', 'quote-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload quote attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own attachments
CREATE POLICY "Users can view their own quote attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'quote-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own quote attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'quote-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access for quote attachments (for sharing)
CREATE POLICY "Public can view quote attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'quote-attachments');

-- Add attachment_url column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS attachment_url text;