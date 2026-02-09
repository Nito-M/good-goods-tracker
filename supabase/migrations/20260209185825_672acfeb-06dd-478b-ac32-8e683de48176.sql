
-- Create org role enum
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member');

-- Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization members table
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper: check if two users share an organization
CREATE OR REPLACE FUNCTION public.users_share_org(_user_id_a uuid, _user_id_b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members a
    JOIN public.organization_members b ON a.organization_id = b.organization_id
    WHERE a.user_id = _user_id_a AND b.user_id = _user_id_b
  )
$$;

-- Helper: check if user is org admin/owner
CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role IN ('owner', 'admin')
  )
$$;

-- Helper: check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- RLS for organizations
CREATE POLICY "Members can view their org" ON public.organizations FOR SELECT
  USING (is_org_member(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins can insert orgs" ON public.organizations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Org admins and super admins can update orgs" ON public.organizations FOR UPDATE
  USING (is_org_admin_or_owner(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins can delete orgs" ON public.organizations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for organization_members
CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Org admins can add members" ON public.organization_members FOR INSERT
  WITH CHECK (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Org admins can update members" ON public.organization_members FOR UPDATE
  USING (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Org admins can remove members" ON public.organization_members FOR DELETE
  USING (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Add org-based SELECT policies to ALL data tables
-- These are PERMISSIVE and OR'd with existing user_id policies
-- So users see: own data OR org members' data OR (if super admin) all data

CREATE POLICY "Org members can view org inventory" ON public.inventory_items FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org sales" ON public.sales FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org sale items" ON public.sale_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND users_share_org(auth.uid(), sales.user_id)));

CREATE POLICY "Org members can view org purchase orders" ON public.purchase_orders FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org quotes" ON public.quotes FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org quote items" ON public.quote_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND users_share_org(auth.uid(), quotes.user_id)));

CREATE POLICY "Org members can view org requests" ON public.requests FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org bank transactions" ON public.bank_transactions FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org calendar events" ON public.calendar_events FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org notes" ON public.notes FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org categories" ON public.categories FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org vendors" ON public.vendors FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org item images" ON public.item_images FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org item vendor prices" ON public.item_vendor_prices FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can view org profiles" ON public.profiles FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
