
CREATE TABLE public.job_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL,
  previous_status text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_status_history_job_id ON public.job_status_history(job_id, created_at);

GRANT SELECT, INSERT ON public.job_status_history TO authenticated;
GRANT ALL ON public.job_status_history TO service_role;

ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view job status history"
ON public.job_status_history FOR SELECT TO authenticated
USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can insert job status history"
ON public.job_status_history FOR INSERT TO authenticated
WITH CHECK (public.users_share_org(auth.uid(), user_id));

CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.job_status_history (job_id, user_id, status, previous_status, changed_by)
    VALUES (NEW.id, NEW.user_id, NEW.status, NULL, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.job_status_history (job_id, user_id, status, previous_status, changed_by)
    VALUES (NEW.id, NEW.user_id, NEW.status, OLD.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_job_status_change
AFTER INSERT OR UPDATE OF status ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.log_job_status_change();

-- Backfill: record current status as initial entry for existing jobs
INSERT INTO public.job_status_history (job_id, user_id, status, previous_status, changed_by, created_at)
SELECT id, user_id, status, NULL, user_id, COALESCE(created_at, now())
FROM public.jobs
WHERE NOT EXISTS (SELECT 1 FROM public.job_status_history h WHERE h.job_id = jobs.id);
