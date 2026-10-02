
-- Allow org admins to view permissions of users in their org
CREATE POLICY "Org admins can view org user permissions"
ON public.user_page_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_page_permissions.user_id
  )
);

-- Allow org admins to insert permissions for users in their org
CREATE POLICY "Org admins can insert org user permissions"
ON public.user_page_permissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_page_permissions.user_id
  )
);

-- Allow org admins to delete permissions for users in their org
CREATE POLICY "Org admins can delete org user permissions"
ON public.user_page_permissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_page_permissions.user_id
  )
);

-- Allow org admins to add members to their org
-- (already exists, but let's also allow org admins to view profiles of org members)
