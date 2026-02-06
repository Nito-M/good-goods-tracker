-- Add picked_up_at column to track pickup status separately from payment status
ALTER TABLE public.sales 
ADD COLUMN picked_up_at timestamp with time zone DEFAULT NULL;