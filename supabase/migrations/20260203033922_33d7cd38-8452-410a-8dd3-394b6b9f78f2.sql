-- Add business_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN business_number text NULL;