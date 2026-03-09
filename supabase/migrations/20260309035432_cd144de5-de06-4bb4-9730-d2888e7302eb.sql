
-- Add slug and storefront_enabled to organizations
ALTER TABLE public.organizations ADD COLUMN slug text UNIQUE;
ALTER TABLE public.organizations ADD COLUMN storefront_enabled boolean NOT NULL DEFAULT false;

-- Add organization_id to storefront_settings
ALTER TABLE public.storefront_settings ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index on slug for fast lookups
CREATE INDEX idx_organizations_slug ON public.organizations(slug) WHERE slug IS NOT NULL;
