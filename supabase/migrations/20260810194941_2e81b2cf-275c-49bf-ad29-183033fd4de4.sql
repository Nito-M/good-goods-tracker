CREATE POLICY "Org members can insert org job items" ON public.job_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND public.users_share_org(auth.uid(), jobs.user_id)));

CREATE POLICY "Org members can update org job items" ON public.job_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND public.users_share_org(auth.uid(), jobs.user_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND public.users_share_org(auth.uid(), jobs.user_id)));

CREATE POLICY "Org members can delete org job items" ON public.job_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_items.job_id AND public.users_share_org(auth.uid(), jobs.user_id)));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_items TO authenticated;
GRANT ALL ON public.job_items TO service_role;