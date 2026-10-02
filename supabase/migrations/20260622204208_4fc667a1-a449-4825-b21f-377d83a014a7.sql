
CREATE TABLE public.vendor_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_notes_vendor_id ON public.vendor_notes(vendor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_notes TO authenticated;
GRANT ALL ON public.vendor_notes TO service_role;

ALTER TABLE public.vendor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendor notes in their org"
  ON public.vendor_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert their own vendor notes"
  ON public.vendor_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update vendor notes in their org"
  ON public.vendor_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can delete vendor notes in their org"
  ON public.vendor_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_vendor_notes_updated_at
  BEFORE UPDATE ON public.vendor_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
