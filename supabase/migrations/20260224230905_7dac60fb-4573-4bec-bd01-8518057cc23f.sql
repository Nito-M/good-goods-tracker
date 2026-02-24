
CREATE POLICY "Org members can update org assemblies"
ON public.assemblies
FOR UPDATE
TO authenticated
USING (users_share_org(auth.uid(), user_id));
