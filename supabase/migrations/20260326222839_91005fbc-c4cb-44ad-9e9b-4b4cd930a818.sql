
CREATE TABLE public.asset_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.asset_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asset images"
  ON public.asset_images FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert own asset images"
  ON public.asset_images FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own asset images"
  ON public.asset_images FOR DELETE TO authenticated
  USING (user_id = auth.uid());
