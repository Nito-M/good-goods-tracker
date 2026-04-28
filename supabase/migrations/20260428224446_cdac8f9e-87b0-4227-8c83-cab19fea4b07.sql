ALTER TABLE public.model_number_slots
  ADD COLUMN IF NOT EXISTS secondary_override_codes jsonb NOT NULL DEFAULT '{}'::jsonb;