-- Add PO-specific settings to companies table
ALTER TABLE public.companies 
  ADD COLUMN po_prefix text NOT NULL DEFAULT 'PO',
  ADD COLUMN po_next_number integer NOT NULL DEFAULT 1,
  ADD COLUMN po_thank_you_note text NOT NULL DEFAULT 'Thank you for your order!';