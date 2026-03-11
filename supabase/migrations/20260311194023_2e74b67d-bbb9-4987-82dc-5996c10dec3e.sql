
ALTER TABLE public.todos ADD COLUMN request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL;
ALTER TABLE public.todos ADD COLUMN purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
