
CREATE TABLE public.user_warehouse_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, warehouse_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_warehouse_permissions TO authenticated;
GRANT ALL ON public.user_warehouse_permissions TO service_role;

ALTER TABLE public.user_warehouse_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own permission rows
CREATE POLICY "Users can view own warehouse permissions"
  ON public.user_warehouse_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Org admins/owners can view rows for members of their orgs
CREATE POLICY "Org admins can view member warehouse permissions"
  ON public.user_warehouse_permissions FOR SELECT
  TO authenticated
  USING (public.is_org_admin_of_user(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Org admins/owners can insert rows for org members
CREATE POLICY "Org admins can insert member warehouse permissions"
  ON public.user_warehouse_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin_of_user(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Org admins/owners can delete rows for org members
CREATE POLICY "Org admins can delete member warehouse permissions"
  ON public.user_warehouse_permissions FOR DELETE
  TO authenticated
  USING (public.is_org_admin_of_user(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'::app_role));
