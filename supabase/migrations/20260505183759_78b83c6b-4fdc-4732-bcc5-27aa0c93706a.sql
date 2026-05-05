CREATE POLICY "Org admins can update member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_org_admin_of_user(auth.uid(), user_id))
WITH CHECK (public.is_org_admin_of_user(auth.uid(), user_id));