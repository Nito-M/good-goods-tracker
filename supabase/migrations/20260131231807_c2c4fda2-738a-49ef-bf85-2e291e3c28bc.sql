-- Add input validation constraints to inventory_items table
ALTER TABLE public.inventory_items
  ADD CONSTRAINT name_length CHECK (length(name) BETWEEN 1 AND 500),
  ADD CONSTRAINT sku_length CHECK (length(sku) BETWEEN 1 AND 100),
  ADD CONSTRAINT description_length CHECK (description IS NULL OR length(description) <= 2000),
  ADD CONSTRAINT price_range CHECK (price >= 0 AND price < 1000000),
  ADD CONSTRAINT cost_range CHECK (cost >= 0 AND cost < 1000000),
  ADD CONSTRAINT quantity_range CHECK (quantity >= 0 AND quantity < 1000000),
  ADD CONSTRAINT min_stock_range CHECK (min_stock >= 0 AND min_stock < 1000000),
  ADD CONSTRAINT weight_positive CHECK (weight >= 0 AND weight < 1000000),
  ADD CONSTRAINT dimensions_positive CHECK (dimensions_length >= 0 AND dimensions_width >= 0 AND dimensions_height >= 0);