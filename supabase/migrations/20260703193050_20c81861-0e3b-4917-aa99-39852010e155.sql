ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);

UPDATE public.jobs j
SET customer_id = c.id
FROM public.customers c
WHERE j.customer_id IS NULL
  AND j.customer_name IS NOT NULL
  AND TRIM(j.customer_name) <> ''
  AND LOWER(TRIM(c.name)) = LOWER(TRIM(j.customer_name))
  AND c.user_id IN (
    SELECT om2.user_id FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = j.user_id
    UNION SELECT j.user_id
  );