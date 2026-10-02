-- Add organization_id to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_org_deleted
  ON public.inventory_items(organization_id, deleted_at);

-- Backfill: assign each item's organization_id to the first org its creator belongs to
UPDATE public.inventory_items ii
SET organization_id = sub.organization_id
FROM (
  SELECT DISTINCT ON (om.user_id) om.user_id, om.organization_id
  FROM public.organization_members om
  ORDER BY om.user_id, om.created_at ASC
) sub
WHERE ii.user_id = sub.user_id
  AND ii.organization_id IS NULL;

-- Replace the loose RLS policies so members only see items for orgs they belong to
DROP POLICY IF EXISTS "Org members can view org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Org admins can update org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory_items;

-- View: members can see items in their orgs; legacy items without an org fall back to creator
CREATE POLICY "Members view org inventory"
ON public.inventory_items
FOR SELECT
USING (
  (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
  OR (organization_id IS NULL AND auth.uid() = user_id)
);

-- Insert: must be the creator AND (no org specified OR member of the target org)
CREATE POLICY "Members insert org inventory"
ON public.inventory_items
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    organization_id IS NULL
    OR public.is_org_member(auth.uid(), organization_id)
  )
);

-- Update: any org member can update items in their org (preserves existing collaborative behavior)
CREATE POLICY "Members update org inventory"
ON public.inventory_items
FOR UPDATE
USING (
  (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
  OR (organization_id IS NULL AND auth.uid() = user_id)
);

-- Delete: creator or org admin/owner can delete
CREATE POLICY "Members delete org inventory"
ON public.inventory_items
FOR DELETE
USING (
  auth.uid() = user_id
  OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(auth.uid(), organization_id))
);