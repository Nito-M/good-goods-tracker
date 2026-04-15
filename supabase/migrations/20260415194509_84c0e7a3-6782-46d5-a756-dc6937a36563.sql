CREATE TABLE public.trailer_subtypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  image_url text,
  trailer_type_id uuid NOT NULL REFERENCES public.trailer_types(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trailer_subtypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trailer subtypes"
  ON public.trailer_subtypes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.prebuilt_assemblies ADD COLUMN trailer_subtype_id uuid REFERENCES public.trailer_subtypes(id) ON DELETE SET NULL;