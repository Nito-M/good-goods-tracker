-- Add link column to item_vendor_prices table for per-item vendor links
ALTER TABLE public.item_vendor_prices
ADD COLUMN link text;