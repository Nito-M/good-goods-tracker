-- Add description column to part_folders table
ALTER TABLE public.part_folders
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;