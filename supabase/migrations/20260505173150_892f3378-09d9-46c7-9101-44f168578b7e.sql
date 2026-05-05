ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Org members can view org notes" ON public.notes;
CREATE POLICY "Org members can view org notes"
ON public.notes
FOR SELECT
USING (users_share_org(auth.uid(), user_id) AND is_private = false);