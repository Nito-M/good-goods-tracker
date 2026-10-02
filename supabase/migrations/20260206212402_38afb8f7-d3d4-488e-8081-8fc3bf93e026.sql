-- Add GST rate column to requests table
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 0;