
CREATE TABLE public.job_instructions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_instructions TO authenticated;
GRANT ALL ON public.job_instructions TO service_role;
ALTER TABLE public.job_instructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org can select job_instructions" ON public.job_instructions FOR SELECT TO authenticated USING (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can insert job_instructions" ON public.job_instructions FOR INSERT TO authenticated WITH CHECK (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can update job_instructions" ON public.job_instructions FOR UPDATE TO authenticated USING (public.users_share_org(auth.uid(), user_id)) WITH CHECK (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can delete job_instructions" ON public.job_instructions FOR DELETE TO authenticated USING (public.users_share_org(auth.uid(), user_id));
CREATE TRIGGER update_job_instructions_updated_at BEFORE UPDATE ON public.job_instructions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_job_instructions_job_id ON public.job_instructions(job_id);

CREATE TABLE public.job_instruction_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id uuid NOT NULL REFERENCES public.job_instructions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_instruction_files TO authenticated;
GRANT ALL ON public.job_instruction_files TO service_role;
ALTER TABLE public.job_instruction_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org can select job_instruction_files" ON public.job_instruction_files FOR SELECT TO authenticated USING (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can insert job_instruction_files" ON public.job_instruction_files FOR INSERT TO authenticated WITH CHECK (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can update job_instruction_files" ON public.job_instruction_files FOR UPDATE TO authenticated USING (public.users_share_org(auth.uid(), user_id)) WITH CHECK (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can delete job_instruction_files" ON public.job_instruction_files FOR DELETE TO authenticated USING (public.users_share_org(auth.uid(), user_id));
CREATE INDEX idx_job_instruction_files_instruction ON public.job_instruction_files(instruction_id);
