
ALTER TABLE public.so_item_job_links
  ADD COLUMN IF NOT EXISTS external_job_number text,
  ADD COLUMN IF NOT EXISTS external_due_date timestamptz,
  ADD COLUMN IF NOT EXISTS external_notes text;
