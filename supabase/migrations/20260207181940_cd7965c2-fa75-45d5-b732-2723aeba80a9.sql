-- Add birth_year column to profiles for account recovery verification
ALTER TABLE public.profiles 
ADD COLUMN birth_year INTEGER NULL;

-- Add a comment explaining the purpose
COMMENT ON COLUMN public.profiles.birth_year IS 'Year of birth used for account recovery verification';