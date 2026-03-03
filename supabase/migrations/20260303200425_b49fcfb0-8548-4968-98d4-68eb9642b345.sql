
ALTER TABLE public.quotes ADD COLUMN hide_prices boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN quote_hide_prices boolean NOT NULL DEFAULT false;
