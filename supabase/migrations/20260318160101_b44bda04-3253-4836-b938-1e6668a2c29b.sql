
DROP POLICY IF EXISTS "Users can update their own parts" ON public.parts;
CREATE POLICY "Org members can update parts" ON public.parts
  FOR UPDATE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id))
  WITH CHECK (public.users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can delete their own parts" ON public.parts;
CREATE POLICY "Org members can delete parts" ON public.parts
  FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));
