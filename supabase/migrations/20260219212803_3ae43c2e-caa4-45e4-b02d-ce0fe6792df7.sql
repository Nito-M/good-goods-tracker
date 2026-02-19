ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS extra_cost numeric NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.requests.extra_cost IS 'Additional cost such as shipping, handling, etc.';