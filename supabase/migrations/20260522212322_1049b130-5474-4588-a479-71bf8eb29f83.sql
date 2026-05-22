ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS payment_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS payment_contact_company TEXT;