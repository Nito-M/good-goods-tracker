-- Add model column to assemblies
ALTER TABLE public.assemblies ADD COLUMN IF NOT EXISTS model TEXT;

-- Create assembly_models table (models scoped under a Type)
CREATE TABLE IF NOT EXISTS public.assembly_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assembly_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assembly models"
ON public.assembly_models FOR SELECT
USING ((user_id = auth.uid()) OR users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert own assembly models"
ON public.assembly_models FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assembly models"
ON public.assembly_models FOR UPDATE
USING ((user_id = auth.uid()) OR users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can delete own assembly models"
ON public.assembly_models FOR DELETE
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_assembly_models_type ON public.assembly_models(type);
CREATE INDEX IF NOT EXISTS idx_assemblies_model ON public.assemblies(model);