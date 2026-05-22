ALTER TABLE public.sales
  ADD COLUMN linked_quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  ADD COLUMN linked_sales_order_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_linked_quote_id ON public.sales(linked_quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_linked_sales_order_id ON public.sales(linked_sales_order_id);