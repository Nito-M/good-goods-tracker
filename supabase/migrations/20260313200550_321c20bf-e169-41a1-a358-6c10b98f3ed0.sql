ALTER TABLE public.asset_parts ADD COLUMN installed_by TEXT DEFAULT '';
ALTER TABLE public.asset_parts ADD COLUMN remove_date DATE DEFAULT NULL;
ALTER TABLE public.asset_parts ADD COLUMN deducted_from_inventory BOOLEAN NOT NULL DEFAULT false;