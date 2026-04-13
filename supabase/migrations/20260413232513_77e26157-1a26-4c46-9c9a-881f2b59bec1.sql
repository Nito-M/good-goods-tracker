
-- Parts Library 2 tables

CREATE TABLE public.parts_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  hours NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  painting_hours NUMERIC NOT NULL DEFAULT 0,
  painting_hourly_rate NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  dxf_url_1 TEXT,
  dxf_url_2 TEXT,
  dxf_label_1 TEXT NOT NULL DEFAULT 'Plasma DXF',
  dxf_label_2 TEXT NOT NULL DEFAULT 'Laser DXF',
  description TEXT,
  folder_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.part_folders_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.part_folders_2(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_2 ADD CONSTRAINT parts_2_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.part_folders_2(id);

CREATE TABLE public.part_inventory_items_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  part_id UUID NOT NULL REFERENCES public.parts_2(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  item_name TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.part_manufacturing_steps_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  part_id UUID NOT NULL REFERENCES public.parts_2(id) ON DELETE CASCADE,
  step_order INT NOT NULL DEFAULT 0,
  operation_type TEXT NOT NULL DEFAULT 'Cut',
  machine TEXT NOT NULL DEFAULT 'Saw',
  notes TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  length TEXT,
  angle TEXT,
  hole_diameter TEXT,
  position_offset TEXT,
  quantity INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.part_step_images_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  step_id UUID NOT NULL REFERENCES public.part_manufacturing_steps_2(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.parts_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_folders_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_inventory_items_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_manufacturing_steps_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_step_images_2 ENABLE ROW LEVEL SECURITY;

-- RLS policies for parts_2
CREATE POLICY "Users can view own parts_2" ON public.parts_2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own parts_2" ON public.parts_2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parts_2" ON public.parts_2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own parts_2" ON public.parts_2 FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for part_folders_2
CREATE POLICY "Users can view own part_folders_2" ON public.part_folders_2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own part_folders_2" ON public.part_folders_2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own part_folders_2" ON public.part_folders_2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own part_folders_2" ON public.part_folders_2 FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for part_inventory_items_2
CREATE POLICY "Users can view own part_inventory_items_2" ON public.part_inventory_items_2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own part_inventory_items_2" ON public.part_inventory_items_2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own part_inventory_items_2" ON public.part_inventory_items_2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own part_inventory_items_2" ON public.part_inventory_items_2 FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for part_manufacturing_steps_2
CREATE POLICY "Users can view own part_manufacturing_steps_2" ON public.part_manufacturing_steps_2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own part_manufacturing_steps_2" ON public.part_manufacturing_steps_2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own part_manufacturing_steps_2" ON public.part_manufacturing_steps_2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own part_manufacturing_steps_2" ON public.part_manufacturing_steps_2 FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for part_step_images_2
CREATE POLICY "Users can view own part_step_images_2" ON public.part_step_images_2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own part_step_images_2" ON public.part_step_images_2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own part_step_images_2" ON public.part_step_images_2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own part_step_images_2" ON public.part_step_images_2 FOR DELETE USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_parts_2_updated_at BEFORE UPDATE ON public.parts_2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_part_folders_2_updated_at BEFORE UPDATE ON public.part_folders_2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_part_manufacturing_steps_2_updated_at BEFORE UPDATE ON public.part_manufacturing_steps_2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('part-images-2', 'part-images-2', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('step-images-2', 'step-images-2', false);

-- Storage policies for part-images-2
CREATE POLICY "Users can view own part images 2" ON storage.objects FOR SELECT USING (bucket_id = 'part-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own part images 2" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'part-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own part images 2" ON storage.objects FOR UPDATE USING (bucket_id = 'part-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own part images 2" ON storage.objects FOR DELETE USING (bucket_id = 'part-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for step-images-2
CREATE POLICY "Users can view own step images 2" ON storage.objects FOR SELECT USING (bucket_id = 'step-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own step images 2" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'step-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own step images 2" ON storage.objects FOR UPDATE USING (bucket_id = 'step-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own step images 2" ON storage.objects FOR DELETE USING (bucket_id = 'step-images-2' AND auth.uid()::text = (storage.foldername(name))[1]);
