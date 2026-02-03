-- Create table to track PO item allocations to sales (FIFO tracking)
CREATE TABLE public.po_item_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  quantity_allocated INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.po_item_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can manage allocations for their own sales
CREATE POLICY "Users can view their own allocations"
ON public.po_item_allocations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sale_items si
    JOIN public.sales s ON si.sale_id = s.id
    WHERE si.id = po_item_allocations.sale_item_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own allocations"
ON public.po_item_allocations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sale_items si
    JOIN public.sales s ON si.sale_id = s.id
    WHERE si.id = po_item_allocations.sale_item_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own allocations"
ON public.po_item_allocations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sale_items si
    JOIN public.sales s ON si.sale_id = s.id
    WHERE si.id = po_item_allocations.sale_item_id
    AND s.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_po_item_allocations_sku ON public.po_item_allocations(sku);
CREATE INDEX idx_po_item_allocations_po_id ON public.po_item_allocations(purchase_order_id);
CREATE INDEX idx_po_item_allocations_sale_item_id ON public.po_item_allocations(sale_item_id);