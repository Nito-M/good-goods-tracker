DROP POLICY IF EXISTS "Org admins can insert member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Org admins can update member profiles" ON public.profiles;

CREATE POLICY "Admins can insert member profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_org_admin_of_user(auth.uid(), user_id)
);

CREATE POLICY "Admins can update member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_org_admin_of_user(auth.uid(), user_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_org_admin_of_user(auth.uid(), user_id)
);