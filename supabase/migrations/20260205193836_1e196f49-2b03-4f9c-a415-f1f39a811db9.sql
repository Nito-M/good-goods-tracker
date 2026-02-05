-- Add invoice_next_number column to profiles table
ALTER TABLE public.profiles
ADD COLUMN invoice_next_number integer DEFAULT 1;