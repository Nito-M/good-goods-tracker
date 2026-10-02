
CREATE TABLE public.vendor_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  job_position TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vendor contacts"
  ON public.vendor_contacts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org members can view org vendor contacts"
  ON public.vendor_contacts FOR SELECT TO authenticated
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert their own vendor contacts"
  ON public.vendor_contacts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vendor contacts"
  ON public.vendor_contacts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own vendor contacts"
  ON public.vendor_contacts FOR DELETE TO authenticated
  USING (user_id = auth.uid());
