
DROP POLICY IF EXISTS "Users can update their own item location quantities" ON public.item_location_quantities;
CREATE POLICY "Org members can update item location quantities"
ON public.item_location_quantities FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id))
WITH CHECK (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can delete their own item location quantities" ON public.item_location_quantities;
CREATE POLICY "Org members can delete item location quantities"
ON public.item_location_quantities FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
