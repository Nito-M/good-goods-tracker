DROP POLICY IF EXISTS "Workers viewable with permission" ON public.workers;
DROP POLICY IF EXISTS "Workers update with permission" ON public.workers;

CREATE POLICY "Workers viewable with permission"
ON public.workers
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM public.worker_access_grants g
    WHERE g.worker_id = workers.id AND g.user_id = auth.uid()
  )
);

CREATE POLICY "Workers update with permission"
ON public.workers
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM public.worker_access_grants g
    WHERE g.worker_id = workers.id AND g.user_id = auth.uid()
  )
);