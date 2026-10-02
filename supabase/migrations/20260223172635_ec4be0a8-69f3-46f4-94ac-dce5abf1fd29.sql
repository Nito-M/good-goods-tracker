
-- Add background_image_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS background_image_url text;

-- Create backgrounds storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own backgrounds
CREATE POLICY "Users can upload their own backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can view their own backgrounds
CREATE POLICY "Users can view their own backgrounds"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can update their own backgrounds
CREATE POLICY "Users can update their own backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can delete their own backgrounds
CREATE POLICY "Users can delete their own backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
