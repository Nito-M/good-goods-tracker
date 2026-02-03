-- Add appearance settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS color_theme text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS background_theme text DEFAULT 'normal';