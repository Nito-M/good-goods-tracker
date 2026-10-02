-- Add display_order column to jobs table for custom ordering
ALTER TABLE public.jobs ADD COLUMN display_order integer NOT NULL DEFAULT 0;

-- Initialize existing jobs with order based on created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.jobs
)
UPDATE public.jobs SET display_order = ordered.rn FROM ordered WHERE public.jobs.id = ordered.id;