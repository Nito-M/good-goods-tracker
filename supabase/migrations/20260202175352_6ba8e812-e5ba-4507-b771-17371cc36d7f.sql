-- Add vendor_id column to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;