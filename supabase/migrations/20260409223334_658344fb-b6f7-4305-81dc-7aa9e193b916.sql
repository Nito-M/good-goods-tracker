
-- Trailer types table
CREATE TABLE public.trailer_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trailer_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trailer types" ON public.trailer_types FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trailer types" ON public.trailer_types FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trailer types" ON public.trailer_types FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trailer types" ON public.trailer_types FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_trailer_types_updated_at BEFORE UPDATE ON public.trailer_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assembly components table
CREATE TABLE public.assembly_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('front_end', 'back_end', 'deck_type')),
  image_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compatible_trailer_type_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assembly_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assembly components" ON public.assembly_components FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assembly components" ON public.assembly_components FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assembly components" ON public.assembly_components FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assembly components" ON public.assembly_components FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_assembly_components_updated_at BEFORE UPDATE ON public.assembly_components FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prebuilt assemblies table
CREATE TABLE public.prebuilt_assemblies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trailer_type_id UUID REFERENCES public.trailer_types(id) ON DELETE CASCADE NOT NULL,
  front_end_id UUID REFERENCES public.assembly_components(id) ON DELETE SET NULL,
  back_end_id UUID REFERENCES public.assembly_components(id) ON DELETE SET NULL,
  deck_type_id UUID REFERENCES public.assembly_components(id) ON DELETE SET NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prebuilt_assemblies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prebuilt assemblies" ON public.prebuilt_assemblies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prebuilt assemblies" ON public.prebuilt_assemblies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prebuilt assemblies" ON public.prebuilt_assemblies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prebuilt assemblies" ON public.prebuilt_assemblies FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_prebuilt_assemblies_updated_at BEFORE UPDATE ON public.prebuilt_assemblies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
