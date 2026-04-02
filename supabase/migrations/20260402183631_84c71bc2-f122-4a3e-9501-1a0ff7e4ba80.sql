
CREATE TABLE public.assembly_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assembly_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assembly categories"
  ON public.assembly_categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert own assembly categories"
  ON public.assembly_categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assembly categories"
  ON public.assembly_categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can delete own assembly categories"
  ON public.assembly_categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
