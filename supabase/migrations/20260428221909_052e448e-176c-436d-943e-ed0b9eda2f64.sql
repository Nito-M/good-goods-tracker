ALTER TABLE public.model_number_slots
ADD COLUMN IF NOT EXISTS conditional_rules JSONB NOT NULL DEFAULT '[]'::jsonb;