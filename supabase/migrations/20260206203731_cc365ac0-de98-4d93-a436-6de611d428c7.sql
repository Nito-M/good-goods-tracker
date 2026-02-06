-- Add need_by_date column to requests table
ALTER TABLE public.requests ADD COLUMN need_by_date timestamp with time zone;