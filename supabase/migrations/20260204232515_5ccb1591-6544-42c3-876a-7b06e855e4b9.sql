-- Add columns to track what a quote was converted to
ALTER TABLE public.quotes 
ADD COLUMN converted_to_invoice_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
ADD COLUMN converted_to_po_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL;