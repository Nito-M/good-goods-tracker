
-- 1. Workers: block anonymous auth users
DROP POLICY IF EXISTS "Workers viewable with permission" ON public.workers;
DROP POLICY IF EXISTS "Workers update with permission" ON public.workers;
DROP POLICY IF EXISTS "Workers delete with permission" ON public.workers;

CREATE POLICY "Workers viewable with permission" ON public.workers
FOR SELECT TO authenticated
USING (
  ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  AND (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (SELECT 1 FROM public.worker_access_grants g WHERE g.worker_id = workers.id AND g.user_id = auth.uid())
  )
);

CREATE POLICY "Workers update with permission" ON public.workers
FOR UPDATE TO authenticated
USING (
  ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  AND (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (SELECT 1 FROM public.worker_access_grants g WHERE g.worker_id = workers.id AND g.user_id = auth.uid())
  )
);

CREATE POLICY "Workers delete with permission" ON public.workers
FOR DELETE TO authenticated
USING (
  ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  AND (auth.uid() = user_id OR public.is_org_admin_of_user(auth.uid(), user_id))
);

-- 2. Worker vendors: restrict update to owner / org admin / direct worker access
DROP POLICY IF EXISTS "Update worker vendors with permission" ON public.worker_vendors;
CREATE POLICY "Update worker vendors with permission" ON public.worker_vendors
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR public.has_worker_access(auth.uid(), worker_id)
);

-- 3. Quotes: add org admin delete policy
CREATE POLICY "Org admins can delete org quotes" ON public.quotes
FOR DELETE TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

-- 4. Part folders: trigger to validate parent_id ownership
CREATE OR REPLACE FUNCTION public.validate_part_folder_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_owner uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO parent_owner FROM public.part_folders WHERE id = NEW.parent_id;
  IF parent_owner IS NULL THEN
    RAISE EXCEPTION 'Parent folder does not exist';
  END IF;
  IF parent_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Parent folder must belong to the same user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_part_folder_parent_trg ON public.part_folders;
CREATE TRIGGER validate_part_folder_parent_trg
BEFORE INSERT OR UPDATE OF parent_id, user_id ON public.part_folders
FOR EACH ROW EXECUTE FUNCTION public.validate_part_folder_parent();

-- 5. assembly_price_history: tighten INSERT policy (trigger uses SECURITY DEFINER so it bypasses RLS)
DROP POLICY IF EXISTS "System can insert price history" ON public.assembly_price_history;
CREATE POLICY "Users insert own price history" ON public.assembly_price_history
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. job-instruction-files storage bucket: verify job ownership from path
-- Path pattern: {job_id}/{instruction_id}/{filename}
DROP POLICY IF EXISTS "authed read job-instruction-files" ON storage.objects;
DROP POLICY IF EXISTS "authed insert job-instruction-files" ON storage.objects;
DROP POLICY IF EXISTS "authed update job-instruction-files" ON storage.objects;
DROP POLICY IF EXISTS "authed delete job-instruction-files" ON storage.objects;

CREATE POLICY "job-instruction-files owner read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'job-instruction-files'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND (j.user_id = auth.uid() OR public.users_share_org(auth.uid(), j.user_id))
  )
);

CREATE POLICY "job-instruction-files owner insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'job-instruction-files'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND (j.user_id = auth.uid() OR public.users_share_org(auth.uid(), j.user_id))
  )
);

CREATE POLICY "job-instruction-files owner update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'job-instruction-files'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND (j.user_id = auth.uid() OR public.users_share_org(auth.uid(), j.user_id))
  )
)
WITH CHECK (
  bucket_id = 'job-instruction-files'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND (j.user_id = auth.uid() OR public.users_share_org(auth.uid(), j.user_id))
  )
);

CREATE POLICY "job-instruction-files owner delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'job-instruction-files'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND (j.user_id = auth.uid() OR public.users_share_org(auth.uid(), j.user_id))
  )
);
