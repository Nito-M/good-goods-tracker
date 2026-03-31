
ALTER TABLE public.instruction_cards ADD COLUMN notes TEXT DEFAULT '';
ALTER TABLE public.instruction_cards ADD COLUMN created_by TEXT NOT NULL DEFAULT '';
