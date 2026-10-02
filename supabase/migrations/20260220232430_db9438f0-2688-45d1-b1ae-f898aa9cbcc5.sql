
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS valid_quantity_unit;
ALTER TABLE inventory_items ADD CONSTRAINT valid_quantity_unit CHECK (quantity_unit IN ('pcs','ft','m','yd','in','sqft'));

ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS valid_dimensions_unit;
ALTER TABLE inventory_items ADD CONSTRAINT valid_dimensions_unit CHECK (dimensions_unit IN ('in','cm','ft'));
