DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

CREATE POLICY "Org members can update org jobs"
ON public.jobs
FOR UPDATE
USING (public.users_share_org(auth.uid(), user_id))
WITH CHECK (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can delete org jobs"
ON public.jobs
FOR DELETE
USING (public.users_share_org(auth.uid(), user_id));