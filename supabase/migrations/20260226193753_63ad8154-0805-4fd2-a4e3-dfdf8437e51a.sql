ALTER TABLE public.inventory_items
  ADD COLUMN pallet_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN box_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN bundle_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN piece_length numeric NOT NULL DEFAULT 0;