
-- Allow org members to view item-images uploaded by any teammate
DROP POLICY IF EXISTS "Org members can view item images" ON storage.objects;
CREATE POLICY "Org members can view item images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'item-images'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om1, public.organization_members om2
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = ((storage.foldername(name))[1])::uuid
      AND om1.organization_id = om2.organization_id
  )
);

-- Allow org members to view request-images uploaded by any teammate
DROP POLICY IF EXISTS "Org members can view request images" ON storage.objects;
CREATE POLICY "Org members can view request images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-images'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om1, public.organization_members om2
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = ((storage.foldername(name))[1])::uuid
      AND om1.organization_id = om2.organization_id
  )
);

-- Allow org members to view part-images-2 uploaded by any teammate
DROP POLICY IF EXISTS "Org members can view part images 2" ON storage.objects;
CREATE POLICY "Org members can view part images 2"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'part-images-2'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om1, public.organization_members om2
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = ((storage.foldername(name))[1])::uuid
      AND om1.organization_id = om2.organization_id
  )
);

-- Allow org members to view step-images-2 uploaded by any teammate
DROP POLICY IF EXISTS "Org members can view step images 2" ON storage.objects;
CREATE POLICY "Org members can view step images 2"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'step-images-2'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om1, public.organization_members om2
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = ((storage.foldername(name))[1])::uuid
      AND om1.organization_id = om2.organization_id
  )
);
