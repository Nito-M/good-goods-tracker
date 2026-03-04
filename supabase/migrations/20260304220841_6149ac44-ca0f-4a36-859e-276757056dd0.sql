ALTER TABLE public.parts
  ADD COLUMN painting_hours numeric NOT NULL DEFAULT 0,
  ADD COLUMN painting_hourly_rate numeric NOT NULL DEFAULT 0;