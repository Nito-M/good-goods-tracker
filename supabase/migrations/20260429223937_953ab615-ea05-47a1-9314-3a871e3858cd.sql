
-- Workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  address TEXT,
  start_date DATE,
  hourly_rate NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers viewable by org members"
  ON public.workers FOR SELECT TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Workers insert by self"
  ON public.workers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers update by org members"
  ON public.workers FOR UPDATE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Workers delete by org members"
  ON public.workers FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Worker file attachments
CREATE TABLE public.worker_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker files viewable by org members"
  ON public.worker_files FOR SELECT TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Worker files insert by self"
  ON public.worker_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Worker files delete by org members"
  ON public.worker_files FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

-- Storage bucket for worker files
INSERT INTO storage.buckets (id, name, public) VALUES ('worker-files', 'worker-files', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Worker files: org members can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-files'
    AND public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Worker files: users upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'worker-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Worker files: org members can delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'worker-files'
    AND public.users_share_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
