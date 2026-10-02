-- Add paid_at column to track when a PO is paid
ALTER TABLE public.purchase_orders
ADD COLUMN paid_at timestamp with time zone DEFAULT NULL;