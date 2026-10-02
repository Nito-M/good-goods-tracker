CREATE POLICY "Org admins can insert member profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_admin_of_user(auth.uid(), user_id));