ALTER TABLE public.prebuilt_assemblies
ADD COLUMN linked_assembly_id uuid REFERENCES public.assemblies(id) ON DELETE SET NULL;

CREATE INDEX idx_prebuilt_assemblies_linked_assembly_id
ON public.prebuilt_assemblies(linked_assembly_id);