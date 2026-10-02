ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS inventory_show_tags boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS inventory_show_images boolean NOT NULL DEFAULT true;