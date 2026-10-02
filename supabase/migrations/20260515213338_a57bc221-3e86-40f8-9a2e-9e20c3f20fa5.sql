
-- 1. Add max_users to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS max_users integer NOT NULL DEFAULT 7;

-- 2. Create organization_page_permissions table
CREATE TABLE IF NOT EXISTS public.organization_page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, page_key)
);

ALTER TABLE public.organization_page_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org page permissions"
ON public.organization_page_permissions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_org_member(auth.uid(), organization_id)
);

CREATE POLICY "Super admins can insert org page permissions"
ON public.organization_page_permissions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can update org page permissions"
ON public.organization_page_permissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can delete org page permissions"
ON public.organization_page_permissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Trigger to enforce max_users when adding members
CREATE OR REPLACE FUNCTION public.enforce_org_max_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max integer;
  _current integer;
BEGIN
  -- Super admins bypass the cap
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT max_users INTO _max FROM public.organizations WHERE id = NEW.organization_id;
  IF _max IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO _current
  FROM public.organization_members
  WHERE organization_id = NEW.organization_id;

  IF _current >= _max THEN
    RAISE EXCEPTION 'Organization has reached its maximum of % users. Contact a super admin to increase the limit.', _max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_org_max_users_trigger ON public.organization_members;
CREATE TRIGGER enforce_org_max_users_trigger
BEFORE INSERT ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.enforce_org_max_users();

-- 4. Allow super admins to update organizations.max_users (relies on existing org update policies; add a permissive one for super admins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'Super admins can update organizations'
  ) THEN
    CREATE POLICY "Super admins can update organizations"
    ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;
