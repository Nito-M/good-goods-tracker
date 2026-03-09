CREATE TABLE public.storefront_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_name text NOT NULL DEFAULT 'Our Shop',
  tagline text DEFAULT '',
  logo_url text DEFAULT NULL,
  announcement_text text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;

-- Owner can manage their settings
CREATE POLICY "Users can manage own storefront settings"
  ON public.storefront_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Org members can view
CREATE POLICY "Org members can view storefront settings"
  ON public.storefront_settings FOR SELECT TO authenticated
  USING (users_share_org(auth.uid(), user_id));