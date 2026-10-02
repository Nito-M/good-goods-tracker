
ALTER TABLE public.inventory_items ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.inventory_items ALTER COLUMN min_stock TYPE NUMERIC;
ALTER TABLE public.purchase_orders ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.quote_items ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.requests ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.job_items ALTER COLUMN quantity TYPE NUMERIC;
