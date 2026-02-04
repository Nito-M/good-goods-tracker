-- Add invoice_layout column to store element positions as JSONB
ALTER TABLE public.profiles 
ADD COLUMN invoice_layout jsonb DEFAULT '{
  "logo": {"x": 20, "y": 20, "visible": true},
  "businessInfo": {"x": 140, "y": 20, "visible": true, "align": "right"},
  "invoiceTitle": {"x": 105, "y": 60, "visible": true, "align": "center"},
  "invoiceDetails": {"x": 20, "y": 75, "visible": true},
  "billTo": {"x": 20, "y": 100, "visible": true},
  "itemsTable": {"x": 20, "y": 130, "visible": true},
  "totals": {"x": 140, "y": -1, "visible": true, "align": "right"},
  "notes": {"x": 20, "y": -1, "visible": true},
  "footer": {"x": 105, "y": -1, "visible": true, "align": "center"}
}'::jsonb;