ALTER TABLE public.trailer_lengths
ADD COLUMN IF NOT EXISTS allowed_axle_counts integer[] NOT NULL DEFAULT '{}';