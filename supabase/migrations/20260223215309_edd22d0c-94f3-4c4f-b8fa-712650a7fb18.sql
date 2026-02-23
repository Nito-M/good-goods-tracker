
CREATE TABLE public.parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  dxf_url_1 TEXT,
  dxf_url_2 TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own parts" ON public.parts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own parts" ON public.parts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own parts" ON public.parts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own parts" ON public.parts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org parts" ON public.parts FOR SELECT USING (users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for part images
INSERT INTO storage.buckets (id, name, public) VALUES ('part-images', 'part-images', false);

-- RLS for part-images bucket
CREATE POLICY "Users can upload part images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'part-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can view part images" ON storage.objects FOR SELECT USING (bucket_id = 'part-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete part images" ON storage.objects FOR DELETE USING (bucket_id = 'part-images' AND auth.role() = 'authenticated');
