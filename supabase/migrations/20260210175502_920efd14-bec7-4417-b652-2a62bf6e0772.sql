
-- Fix: Allow deleting inventory_items by setting references to NULL
ALTER TABLE sale_items DROP CONSTRAINT sale_items_inventory_item_id_fkey;
ALTER TABLE sale_items ADD CONSTRAINT sale_items_inventory_item_id_fkey
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL;

ALTER TABLE quote_items DROP CONSTRAINT quote_items_inventory_item_id_fkey;
ALTER TABLE quote_items ADD CONSTRAINT quote_items_inventory_item_id_fkey
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL;

ALTER TABLE requests DROP CONSTRAINT requests_inventory_item_id_fkey;
ALTER TABLE requests ADD CONSTRAINT requests_inventory_item_id_fkey
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL;

-- Fix: Allow deleting purchase_orders by clearing quote references
ALTER TABLE quotes DROP CONSTRAINT quotes_converted_to_po_id_fkey;
ALTER TABLE quotes ADD CONSTRAINT quotes_converted_to_po_id_fkey
  FOREIGN KEY (converted_to_po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL;

-- Fix: Allow deleting requests by clearing PO references
ALTER TABLE purchase_orders DROP CONSTRAINT purchase_orders_request_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_request_id_fkey
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL;
