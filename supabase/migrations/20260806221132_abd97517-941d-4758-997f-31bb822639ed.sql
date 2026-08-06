DROP POLICY IF EXISTS "Users can delete own assembly categories" ON public.assembly_categories;

CREATE POLICY "Organization members can delete assembly categories"
ON public.assembly_categories
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.users_share_org(auth.uid(), user_id)
);