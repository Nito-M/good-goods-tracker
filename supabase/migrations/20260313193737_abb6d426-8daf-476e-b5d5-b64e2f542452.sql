
-- Assets main table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'Equipment',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  year INTEGER DEFAULT NULL,
  serial_number TEXT DEFAULT '',
  vin TEXT DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  external_link TEXT DEFAULT NULL,
  current_location TEXT DEFAULT '',
  assigned_shop TEXT DEFAULT '',
  assigned_employee TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  odometer NUMERIC DEFAULT NULL,
  engine_hours NUMERIC DEFAULT NULL,
  last_service_date DATE DEFAULT NULL,
  service_interval_days INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org assets" ON public.assets FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- Asset installed parts
CREATE TABLE public.asset_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  install_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own asset parts" ON public.asset_parts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own asset parts" ON public.asset_parts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own asset parts" ON public.asset_parts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own asset parts" ON public.asset_parts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org asset parts" ON public.asset_parts FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- Asset maintenance history
CREATE TABLE public.asset_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL DEFAULT '',
  parts_used TEXT DEFAULT NULL,
  cost NUMERIC DEFAULT 0,
  technician TEXT DEFAULT '',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own asset maintenance" ON public.asset_maintenance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own asset maintenance" ON public.asset_maintenance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own asset maintenance" ON public.asset_maintenance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own asset maintenance" ON public.asset_maintenance FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org asset maintenance" ON public.asset_maintenance FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- Asset documents
CREATE TABLE public.asset_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT '',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own asset documents" ON public.asset_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own asset documents" ON public.asset_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own asset documents" ON public.asset_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own asset documents" ON public.asset_documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org asset documents" ON public.asset_documents FOR SELECT USING (users_share_org(auth.uid(), user_id));
