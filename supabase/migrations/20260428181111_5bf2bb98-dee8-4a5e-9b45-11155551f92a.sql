-- Create table for available parts (catalog of parts that COULD be installed on an asset)
CREATE TABLE public.asset_available_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(12,2),
  link TEXT,
  image_url TEXT,
  vendor TEXT,
  vendor_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_available_parts_asset_id ON public.asset_available_parts(asset_id);

ALTER TABLE public.asset_available_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view available parts in their org"
ON public.asset_available_parts FOR SELECT TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can create their own available parts"
ON public.asset_available_parts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users in same org can update available parts"
ON public.asset_available_parts FOR UPDATE TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users in same org can delete available parts"
ON public.asset_available_parts FOR DELETE TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_asset_available_parts_updated_at
BEFORE UPDATE ON public.asset_available_parts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();