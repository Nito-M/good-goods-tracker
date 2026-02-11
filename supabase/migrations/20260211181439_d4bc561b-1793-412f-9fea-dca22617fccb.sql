-- Add customer fields to jobs table
ALTER TABLE public.jobs ADD COLUMN customer_name text;
ALTER TABLE public.jobs ADD COLUMN customer_email text;
ALTER TABLE public.jobs ADD COLUMN customer_phone text;
ALTER TABLE public.jobs ADD COLUMN customer_address text;