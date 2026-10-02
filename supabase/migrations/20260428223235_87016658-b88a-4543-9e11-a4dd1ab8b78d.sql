ALTER TABLE public.model_number_slots
  ADD COLUMN IF NOT EXISTS secondary_slot_kind text,
  ADD COLUMN IF NOT EXISTS secondary_fixed_text text;