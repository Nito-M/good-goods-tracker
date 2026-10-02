
CREATE OR REPLACE FUNCTION public.is_worker_org_admin(_user_id uuid, _worker_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workers w
    WHERE w.id = _worker_id
      AND public.is_org_admin_of_user(_user_id, w.user_id)
  )
$$;

DROP POLICY IF EXISTS "Grants viewable by recipient or worker org admin" ON public.worker_access_grants;
CREATE POLICY "Grants viewable by recipient or worker org admin"
ON public.worker_access_grants FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_worker_org_admin(auth.uid(), worker_id)
);

DROP POLICY IF EXISTS "Grants insert by worker org admin" ON public.worker_access_grants;
CREATE POLICY "Grants insert by worker org admin"
ON public.worker_access_grants FOR INSERT TO authenticated
WITH CHECK (
  public.is_worker_org_admin(auth.uid(), worker_id)
);

DROP POLICY IF EXISTS "Grants delete by worker org admin" ON public.worker_access_grants;
CREATE POLICY "Grants delete by worker org admin"
ON public.worker_access_grants FOR DELETE TO authenticated
USING (
  public.is_worker_org_admin(auth.uid(), worker_id)
);
