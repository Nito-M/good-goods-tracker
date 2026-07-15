
CREATE TABLE public.sop_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('department','author','approver')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sop_options_kind_idx ON public.sop_options(kind);
CREATE INDEX sop_options_user_idx ON public.sop_options(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_options TO authenticated;
GRANT ALL ON public.sop_options TO service_role;

ALTER TABLE public.sop_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sop_options"
  ON public.sop_options FOR SELECT
  USING (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members can insert sop_options"
  ON public.sop_options FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members can update sop_options"
  ON public.sop_options FOR UPDATE
  USING (public.users_share_org(auth.uid(), user_id))
  WITH CHECK (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete sop_options"
  ON public.sop_options FOR DELETE
  USING (public.users_share_org(auth.uid(), user_id));
