ALTER TABLE public.purchase_orders 
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS partially_received_at timestamptz;