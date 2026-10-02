CREATE TABLE public.worker_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vendor_name text,
  vendor_username text,
  vendor_email text,
  vendor_password text,
  vendor_link text,
  vendor_notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_vendors_worker_id ON public.worker_vendors(worker_id);

ALTER TABLE public.worker_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View worker vendors in org"
  ON public.worker_vendors FOR SELECT TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Insert own worker vendors"
  ON public.worker_vendors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update worker vendors in org"
  ON public.worker_vendors FOR UPDATE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Delete worker vendors in org"
  ON public.worker_vendors FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_worker_vendors_updated_at
  BEFORE UPDATE ON public.worker_vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing single vendor data to new table
INSERT INTO public.worker_vendors (worker_id, user_id, vendor_name, vendor_email, vendor_password, vendor_link, vendor_notes)
SELECT id, user_id, vendor_name, vendor_email, vendor_password, vendor_link, vendor_notes
FROM public.workers
WHERE vendor_name IS NOT NULL OR vendor_email IS NOT NULL OR vendor_password IS NOT NULL OR vendor_link IS NOT NULL OR vendor_notes IS NOT NULL;