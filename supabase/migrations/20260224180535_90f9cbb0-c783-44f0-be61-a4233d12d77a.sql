ALTER TABLE public.tax_documents
  ADD COLUMN IF NOT EXISTS extracted_vendor text,
  ADD COLUMN IF NOT EXISTS extracted_date date,
  ADD COLUMN IF NOT EXISTS extracted_total numeric,
  ADD COLUMN IF NOT EXISTS extracted_gst numeric,
  ADD COLUMN IF NOT EXISTS extraction_status text DEFAULT 'pending';