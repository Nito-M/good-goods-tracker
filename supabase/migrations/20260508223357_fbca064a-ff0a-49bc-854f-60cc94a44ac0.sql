
-- Worker access grants table
CREATE TABLE public.worker_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, user_id)
);

CREATE INDEX idx_worker_access_grants_worker ON public.worker_access_grants(worker_id);
CREATE INDEX idx_worker_access_grants_user ON public.worker_access_grants(user_id);

ALTER TABLE public.worker_access_grants ENABLE ROW LEVEL SECURITY;

-- Helper: does a user have access to a specific worker?
CREATE OR REPLACE FUNCTION public.has_worker_access(_user_id uuid, _worker_id uuid)
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
      AND (
        w.user_id = _user_id
        OR public.is_org_admin_of_user(_user_id, w.user_id)
        OR EXISTS (
          SELECT 1 FROM public.user_feature_permissions ufp
          WHERE ufp.user_id = _user_id AND ufp.feature_key = 'view_all_workers'
        )
        OR EXISTS (
          SELECT 1 FROM public.worker_access_grants g
          WHERE g.worker_id = _worker_id AND g.user_id = _user_id
        )
      )
  )
$$;

-- RLS for worker_access_grants
CREATE POLICY "Grants viewable by recipient or worker org admin"
ON public.worker_access_grants FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id
      AND public.is_org_admin_of_user(auth.uid(), w.user_id)
  )
);

CREATE POLICY "Grants insert by worker org admin"
ON public.worker_access_grants FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id
      AND public.is_org_admin_of_user(auth.uid(), w.user_id)
  )
);

CREATE POLICY "Grants delete by worker org admin"
ON public.worker_access_grants FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id
      AND public.is_org_admin_of_user(auth.uid(), w.user_id)
  )
);

-- Update workers RLS to include per-worker grants
DROP POLICY IF EXISTS "Workers viewable with permission" ON public.workers;
CREATE POLICY "Workers viewable with permission"
ON public.workers FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_feature_permissions ufp
    WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
  )
  OR EXISTS (
    SELECT 1 FROM public.worker_access_grants g
    WHERE g.worker_id = workers.id AND g.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Workers update with permission" ON public.workers;
CREATE POLICY "Workers update with permission"
ON public.workers FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_feature_permissions ufp
    WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
  )
  OR EXISTS (
    SELECT 1 FROM public.worker_access_grants g
    WHERE g.worker_id = workers.id AND g.user_id = auth.uid()
  )
);

-- Update worker_vendors RLS
DROP POLICY IF EXISTS "View worker vendors with permission" ON public.worker_vendors;
CREATE POLICY "View worker vendors with permission"
ON public.worker_vendors FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_feature_permissions ufp
    WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
  )
  OR public.has_worker_access(auth.uid(), worker_vendors.worker_id)
);

DROP POLICY IF EXISTS "Update worker vendors with permission" ON public.worker_vendors;
CREATE POLICY "Update worker vendors with permission"
ON public.worker_vendors FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_feature_permissions ufp
    WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
  )
  OR public.has_worker_access(auth.uid(), worker_vendors.worker_id)
);

-- Allow granted members to insert vendors on workers they have access to
DROP POLICY IF EXISTS "Insert own worker vendors" ON public.worker_vendors;
CREATE POLICY "Insert worker vendors with permission"
ON public.worker_vendors FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_worker_access(auth.uid(), worker_id)
);

-- Update worker_files RLS
DROP POLICY IF EXISTS "Worker files viewable with permission" ON public.worker_files;
CREATE POLICY "Worker files viewable with permission"
ON public.worker_files FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_org_admin_of_user(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_feature_permissions ufp
    WHERE ufp.user_id = auth.uid() AND ufp.feature_key = 'view_all_workers'
  )
  OR public.has_worker_access(auth.uid(), worker_files.worker_id)
);

DROP POLICY IF EXISTS "Worker files insert by self" ON public.worker_files;
CREATE POLICY "Worker files insert with permission"
ON public.worker_files FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_worker_access(auth.uid(), worker_id)
);
