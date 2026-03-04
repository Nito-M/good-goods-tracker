ALTER TABLE public.parts ADD COLUMN hours numeric NOT NULL DEFAULT 0;
ALTER TABLE public.parts ADD COLUMN hourly_rate numeric NOT NULL DEFAULT 0;