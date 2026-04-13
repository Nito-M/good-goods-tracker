
ALTER TABLE public.prebuilt_assemblies
  ADD COLUMN front_end_tier2_id UUID REFERENCES public.assembly_components(id) ON DELETE SET NULL,
  ADD COLUMN under_carriage_tier2_id UUID REFERENCES public.assembly_components(id) ON DELETE SET NULL,
  ADD COLUMN under_carriage_tier3_id UUID REFERENCES public.assembly_components(id) ON DELETE SET NULL,
  ADD COLUMN under_carriage_axle_count INTEGER;
