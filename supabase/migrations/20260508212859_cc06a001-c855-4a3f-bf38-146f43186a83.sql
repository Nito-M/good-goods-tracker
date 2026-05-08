-- Restrict worker and worker_vendor visibility: members see only their own unless granted feature permission; org admins see all.

-- WORKERS
DROP POLICY IF EXISTS "Workers viewable by org members" ON public.workers;
DROP POLICY IF EXISTS "Workers update by org members" ON public.workers;
DROP POLICY IF EXISTS "Workers delete by org members" ON public.workers;

CREATE POLICY "Workers viewable with permission"
  ON public.workers FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_feature_permissions ufp
      WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
    )
  );

CREATE POLICY "Workers update with permission"
  ON public.workers FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_feature_permissions ufp
      WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
    )
  );

CREATE POLICY "Workers delete with permission"
  ON public.workers FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
  );

-- WORKER VENDORS
DROP POLICY IF EXISTS "View worker vendors in org" ON public.worker_vendors;
DROP POLICY IF EXISTS "Update worker vendors in org" ON public.worker_vendors;
DROP POLICY IF EXISTS "Delete worker vendors in org" ON public.worker_vendors;

CREATE POLICY "View worker vendors with permission"
  ON public.worker_vendors FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_feature_permissions ufp
      WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
    )
  );

CREATE POLICY "Update worker vendors with permission"
  ON public.worker_vendors FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_feature_permissions ufp
      WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
    )
  );

CREATE POLICY "Delete worker vendors with permission"
  ON public.worker_vendors FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
  );

-- WORKER FILES
DROP POLICY IF EXISTS "Worker files viewable by org members" ON public.worker_files;
DROP POLICY IF EXISTS "Worker files delete by org members" ON public.worker_files;

CREATE POLICY "Worker files viewable with permission"
  ON public.worker_files FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_feature_permissions ufp
      WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
    )
  );

CREATE POLICY "Worker files delete with permission"
  ON public.worker_files FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_org_admin_of_user(auth.uid(), user_id)
  );
