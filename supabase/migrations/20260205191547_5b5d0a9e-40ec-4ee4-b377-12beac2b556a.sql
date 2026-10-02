-- Add invoice_prefix column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN invoice_prefix text DEFAULT 'INV';