-- Remove public SELECT policies
DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view quote attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view request images" ON storage.objects;

-- Set all four buckets to private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('logos', 'quote-attachments', 'request-images', 'purchase-orders');