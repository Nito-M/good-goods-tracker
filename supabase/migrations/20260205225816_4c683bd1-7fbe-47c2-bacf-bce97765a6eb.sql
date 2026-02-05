-- Add link column to vendors table
ALTER TABLE public.vendors
ADD COLUMN link text;

-- Add comment for documentation
COMMENT ON COLUMN public.vendors.link IS 'URL link to vendor website or portal';