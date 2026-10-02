
-- Table for feature-level permissions (e.g. view_all_requests)
CREATE TABLE public.user_feature_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_key)
);

ALTER TABLE public.user_feature_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own feature permissions
CREATE POLICY "Users can read own feature permissions"
ON public.user_feature_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all feature permissions
CREATE POLICY "Admins can read all feature permissions"
ON public.user_feature_permissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert feature permissions
CREATE POLICY "Admins can insert feature permissions"
ON public.user_feature_permissions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete feature permissions
CREATE POLICY "Admins can delete feature permissions"
ON public.user_feature_permissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Org admins can manage feature permissions for users in their org
CREATE OR REPLACE FUNCTION public.is_org_admin_of_user(_admin_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members admin_m
    JOIN public.organization_members target_m ON admin_m.organization_id = target_m.organization_id
    WHERE admin_m.user_id = _admin_id
      AND admin_m.role IN ('owner', 'admin')
      AND target_m.user_id = _target_user_id
  )
$$;

CREATE POLICY "Org admins can read feature permissions for org users"
ON public.user_feature_permissions
FOR SELECT
TO authenticated
USING (public.is_org_admin_of_user(auth.uid(), user_id));

CREATE POLICY "Org admins can insert feature permissions for org users"
ON public.user_feature_permissions
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_admin_of_user(auth.uid(), user_id));

CREATE POLICY "Org admins can delete feature permissions for org users"
ON public.user_feature_permissions
FOR DELETE
TO authenticated
USING (public.is_org_admin_of_user(auth.uid(), user_id));
