
-- 1. password_reset_tokens: deny-all RLS (service_role bypasses)
DROP POLICY IF EXISTS "Service role only" ON public.password_reset_tokens;
CREATE POLICY "Service role only"
  ON public.password_reset_tokens
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- 2. trailer_subtypes: replace permissive policy with owner-scoped
DROP POLICY IF EXISTS "Users can manage their own trailer subtypes" ON public.trailer_subtypes;
CREATE POLICY "Users can view own trailer subtypes"
  ON public.trailer_subtypes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trailer subtypes"
  ON public.trailer_subtypes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trailer subtypes"
  ON public.trailer_subtypes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trailer subtypes"
  ON public.trailer_subtypes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. workers: tighten roles from public to authenticated
DROP POLICY IF EXISTS "Workers viewable with permission" ON public.workers;
CREATE POLICY "Workers viewable with permission"
  ON public.workers FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM worker_access_grants g
      WHERE g.worker_id = workers.id AND g.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workers update with permission" ON public.workers;
CREATE POLICY "Workers update with permission"
  ON public.workers FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM worker_access_grants g
      WHERE g.worker_id = workers.id AND g.user_id = auth.uid()
    )
  );

-- 4. part-images storage: folder-based ownership
DROP POLICY IF EXISTS "Users can view part images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload part images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete part images" ON storage.objects;

CREATE POLICY "Users can view their own part images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'part-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own part images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'part-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own part images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'part-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Org members can view org part images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'part-images'
    AND EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = ((storage.foldername(objects.name))[1])::uuid
    )
  );

-- 5. instruction-files: restrict SELECT to owner
DROP POLICY IF EXISTS "Users can view instruction files" ON storage.objects;
CREATE POLICY "Users can view their own instruction files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'instruction-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Org members can view org instruction files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'instruction-files'
    AND EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = ((storage.foldername(objects.name))[1])::uuid
    )
  );

-- 6. trailer-images: restrict SELECT to owner
DROP POLICY IF EXISTS "Users can view trailer images" ON storage.objects;
CREATE POLICY "Users can view their own trailer images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'trailer-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Org members can view org trailer images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'trailer-images'
    AND EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = ((storage.foldername(objects.name))[1])::uuid
    )
  );
