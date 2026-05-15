
-- Welcome screen settings (singleton row with id = 1)
CREATE TABLE public.app_welcome_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  background_image_url TEXT,
  greeting_text TEXT NOT NULL DEFAULT 'Welcome',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT app_welcome_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.app_welcome_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read welcome settings
CREATE POLICY "Authenticated can view welcome settings"
ON public.app_welcome_settings
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can insert/update/delete
CREATE POLICY "Super admins can insert welcome settings"
ON public.app_welcome_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can update welcome settings"
ON public.app_welcome_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can delete welcome settings"
ON public.app_welcome_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed singleton row
INSERT INTO public.app_welcome_settings (id, greeting_text)
VALUES (1, 'Welcome')
ON CONFLICT (id) DO NOTHING;

-- Public bucket for welcome background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('welcome-images', 'welcome-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can read welcome images (it's a public bucket)
CREATE POLICY "Public can view welcome images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'welcome-images');

-- Only super admins can upload/update/delete welcome images
CREATE POLICY "Super admins can upload welcome images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'welcome-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can update welcome images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'welcome-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can delete welcome images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'welcome-images' AND public.has_role(auth.uid(), 'admin'::app_role));
