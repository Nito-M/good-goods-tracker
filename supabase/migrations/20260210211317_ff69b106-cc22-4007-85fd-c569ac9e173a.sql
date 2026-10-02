
-- Allow org admins to update org members' inventory items (for soft-delete)
CREATE POLICY "Org admins can update org inventory"
  ON public.inventory_items FOR UPDATE
  USING (public.users_share_org(auth.uid(), user_id));

-- Allow org admins to delete org members' purchase orders
CREATE POLICY "Org admins can delete org purchase orders"
  ON public.purchase_orders FOR DELETE
  USING (public.users_share_org(auth.uid(), user_id));

-- Allow org admins to delete org members' requests
CREATE POLICY "Org admins can delete org requests"
  ON public.requests FOR DELETE
  USING (public.users_share_org(auth.uid(), user_id));

-- Allow org admins to update org members' requests (for status changes)
CREATE POLICY "Org admins can update org requests"
  ON public.requests FOR UPDATE
  USING (public.users_share_org(auth.uid(), user_id));
