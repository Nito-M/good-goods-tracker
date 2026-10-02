ALTER TABLE public.profiles ADD COLUMN inventory_markup_percent NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.profiles.inventory_markup_percent IS 'Default markup percentage applied to item cost when calculating upscale selling price in inventory table';