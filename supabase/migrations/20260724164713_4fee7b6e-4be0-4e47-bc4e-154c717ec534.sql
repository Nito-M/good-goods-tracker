
ALTER TABLE public.customer_contacts DROP COLUMN IF EXISTS role;
ALTER TABLE public.customer_contacts ADD COLUMN IF NOT EXISTS job_position text;
ALTER TABLE public.customer_contacts ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
