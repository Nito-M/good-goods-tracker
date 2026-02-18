ALTER TABLE public.assemblies
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not_finished',
  ADD COLUMN IF NOT EXISTS status_notes text NULL;