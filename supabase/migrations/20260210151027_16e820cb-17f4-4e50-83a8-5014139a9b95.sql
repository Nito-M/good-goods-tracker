-- Drop existing foreign key and re-add with CASCADE
ALTER TABLE public.po_item_allocations
  DROP CONSTRAINT po_item_allocations_purchase_order_id_fkey;

ALTER TABLE public.po_item_allocations
  ADD CONSTRAINT po_item_allocations_purchase_order_id_fkey
  FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;