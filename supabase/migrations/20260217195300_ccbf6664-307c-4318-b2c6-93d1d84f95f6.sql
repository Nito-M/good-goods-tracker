
-- Add invoice and quote settings columns to companies table
ALTER TABLE public.companies
  ADD COLUMN invoice_prefix text NOT NULL DEFAULT 'INV',
  ADD COLUMN invoice_next_number integer NOT NULL DEFAULT 1,
  ADD COLUMN invoice_thank_you_note text NOT NULL DEFAULT 'Thank you for your business!',
  ADD COLUMN invoice_layout jsonb DEFAULT '{"logo": {"x": 20, "y": 20, "visible": true}, "notes": {"x": 20, "y": -1, "visible": true}, "billTo": {"x": 20, "y": 100, "visible": true}, "footer": {"x": 105, "y": -1, "align": "center", "visible": true}, "totals": {"x": 140, "y": -1, "align": "right", "visible": true}, "itemsTable": {"x": 20, "y": 130, "visible": true}, "businessInfo": {"x": 140, "y": 20, "align": "right", "visible": true}, "invoiceTitle": {"x": 105, "y": 60, "align": "center", "visible": true}, "invoiceDetails": {"x": 20, "y": 75, "visible": true}}'::jsonb,
  ADD COLUMN quote_thank_you_note text NOT NULL DEFAULT 'Thank you for considering our services!',
  ADD COLUMN quote_validity_days integer NOT NULL DEFAULT 30,
  ADD COLUMN quote_layout jsonb DEFAULT '{"logo": {"x": 20, "y": 20, "visible": true}, "notes": {"x": 20, "y": -1, "visible": true}, "billTo": {"x": 20, "y": 100, "visible": true}, "footer": {"x": 105, "y": -1, "align": "center", "visible": true}, "totals": {"x": 140, "y": -1, "align": "right", "visible": true}, "itemsTable": {"x": 20, "y": 130, "visible": true}, "quoteTitle": {"x": 105, "y": 60, "align": "center", "visible": true}, "businessInfo": {"x": 140, "y": 20, "align": "right", "visible": true}, "quoteDetails": {"x": 20, "y": 75, "visible": true}}'::jsonb;

-- Migrate existing profile settings into companies
UPDATE public.companies c
SET
  invoice_prefix = COALESCE(p.invoice_prefix, 'INV'),
  invoice_next_number = COALESCE(p.invoice_next_number, 1),
  invoice_thank_you_note = COALESCE(p.invoice_thank_you_note, 'Thank you for your business!'),
  invoice_layout = COALESCE(p.invoice_layout, c.invoice_layout),
  quote_thank_you_note = COALESCE(p.quote_thank_you_note, 'Thank you for considering our services!'),
  quote_validity_days = COALESCE(p.quote_validity_days, 30),
  quote_layout = COALESCE(p.quote_layout, c.quote_layout)
FROM public.profiles p
WHERE c.user_id = p.user_id;
