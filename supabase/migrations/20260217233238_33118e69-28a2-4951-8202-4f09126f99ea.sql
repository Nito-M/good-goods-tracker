
ALTER TABLE public.quotes ADD COLUMN converted_to_job_id uuid REFERENCES public.jobs(id);
