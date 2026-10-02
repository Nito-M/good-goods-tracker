-- Add requester_names array column to profiles for multiple requesters
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS requester_names text[] DEFAULT '{}';

-- Migrate existing requester_name to the new array if it exists
UPDATE public.profiles 
SET requester_names = ARRAY[requester_name]
WHERE requester_name IS NOT NULL AND requester_name != '' AND (requester_names IS NULL OR requester_names = '{}');