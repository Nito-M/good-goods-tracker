-- Create table for storefront category pages
CREATE TABLE IF NOT EXISTS public.storefront_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, category_name)
);

-- Enable RLS
ALTER TABLE public.storefront_categories ENABLE ROW LEVEL SECURITY;

-- Policies for storefront_categories
CREATE POLICY "Org members can view org storefront categories"
  ON public.storefront_categories FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can insert storefront categories"
  ON public.storefront_categories FOR INSERT
  WITH CHECK (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can update storefront categories"
  ON public.storefront_categories FOR UPDATE
  USING (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can delete storefront categories"
  ON public.storefront_categories FOR DELETE
  USING (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_storefront_categories_updated_at
  BEFORE UPDATE ON public.storefront_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();