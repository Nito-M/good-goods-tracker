
CREATE TABLE public.request_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_request_notes_request_number ON public.request_notes(request_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_notes TO authenticated;
GRANT ALL ON public.request_notes TO service_role;

ALTER TABLE public.request_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view request notes in their org"
  ON public.request_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert their own request notes"
  ON public.request_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update request notes in their org"
  ON public.request_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can delete request notes in their org"
  ON public.request_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_request_notes_updated_at
  BEFORE UPDATE ON public.request_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
