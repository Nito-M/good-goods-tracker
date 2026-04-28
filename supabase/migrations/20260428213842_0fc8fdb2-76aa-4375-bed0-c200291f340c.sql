
-- Add model_code columns to existing tables
ALTER TABLE public.trailer_types ADD COLUMN IF NOT EXISTS model_code text;
ALTER TABLE public.trailer_subtypes ADD COLUMN IF NOT EXISTS model_code text;
ALTER TABLE public.trailer_lengths ADD COLUMN IF NOT EXISTS model_code text;
ALTER TABLE public.assembly_components ADD COLUMN IF NOT EXISTS model_code text;

-- Template table (one per user)
CREATE TABLE IF NOT EXISTS public.model_number_template (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  separator text NOT NULL DEFAULT '-',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.model_number_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View shared org model templates"
ON public.model_number_template FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Insert own model template"
ON public.model_number_template FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update shared org model templates"
ON public.model_number_template FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Delete shared org model templates"
ON public.model_number_template FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_model_number_template_updated_at
BEFORE UPDATE ON public.model_number_template
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Slot table (8 ordered positions per template)
CREATE TABLE IF NOT EXISTS public.model_number_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.model_number_template(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position int NOT NULL CHECK (position BETWEEN 1 AND 8),
  slot_kind text NOT NULL DEFAULT 'empty',
  fixed_text text,
  override_codes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, position)
);

ALTER TABLE public.model_number_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View shared org model slots"
ON public.model_number_slots FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Insert own model slots"
ON public.model_number_slots FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update shared org model slots"
ON public.model_number_slots FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Delete shared org model slots"
ON public.model_number_slots FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_model_number_slots_updated_at
BEFORE UPDATE ON public.model_number_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_model_number_slots_template ON public.model_number_slots(template_id, position);
