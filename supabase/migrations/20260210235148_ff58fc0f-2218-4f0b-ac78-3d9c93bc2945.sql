
CREATE TABLE public.job_sidebar_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.job_sidebar_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sidebar links"
ON public.job_sidebar_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sidebar links"
ON public.job_sidebar_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sidebar links"
ON public.job_sidebar_links FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sidebar links"
ON public.job_sidebar_links FOR DELETE
USING (auth.uid() = user_id);
