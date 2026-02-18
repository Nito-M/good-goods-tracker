ALTER TABLE public.assemblies
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'General';