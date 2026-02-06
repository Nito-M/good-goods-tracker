-- Add price column to requests table
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;