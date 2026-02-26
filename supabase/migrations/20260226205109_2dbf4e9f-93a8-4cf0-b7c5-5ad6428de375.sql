CREATE POLICY "Org members can insert org assembly items"
ON public.assembly_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
      AND users_share_org(auth.uid(), assemblies.user_id)
  )
);

CREATE POLICY "Org members can update org assembly items"
ON public.assembly_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
      AND users_share_org(auth.uid(), assemblies.user_id)
  )
);

CREATE POLICY "Org members can delete org assembly items"
ON public.assembly_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
      AND users_share_org(auth.uid(), assemblies.user_id)
  )
);