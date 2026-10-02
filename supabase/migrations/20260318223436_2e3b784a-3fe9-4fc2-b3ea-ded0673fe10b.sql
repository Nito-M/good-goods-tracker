
-- Create part_step_images table
CREATE TABLE public.part_step_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id UUID NOT NULL REFERENCES public.part_manufacturing_steps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.part_step_images ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own step images" ON public.part_step_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own step images" ON public.part_step_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own step images" ON public.part_step_images FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org step images" ON public.part_step_images FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- Create storage bucket for step images
INSERT INTO storage.buckets (id, name, public) VALUES ('step-images', 'step-images', false);

-- Storage policies
CREATE POLICY "Users can upload step images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'step-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view step images" ON storage.objects FOR SELECT USING (bucket_id = 'step-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete step images" ON storage.objects FOR DELETE USING (bucket_id = 'step-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Org members can view org step images" ON storage.objects FOR SELECT USING (bucket_id = 'step-images' AND EXISTS (SELECT 1 FROM public.organization_members om1, public.organization_members om2 WHERE om1.user_id = auth.uid() AND om2.user_id = (storage.foldername(name))[1]::uuid AND om1.organization_id = om2.organization_id));
