
CREATE TABLE public.job_instruction_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id uuid NOT NULL REFERENCES public.job_instructions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  sku text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  notes text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_instruction_parts TO authenticated;
GRANT ALL ON public.job_instruction_parts TO service_role;
ALTER TABLE public.job_instruction_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org can select job_instruction_parts" ON public.job_instruction_parts FOR SELECT TO authenticated USING (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can insert job_instruction_parts" ON public.job_instruction_parts FOR INSERT TO authenticated WITH CHECK (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can update job_instruction_parts" ON public.job_instruction_parts FOR UPDATE TO authenticated USING (public.users_share_org(auth.uid(), user_id)) WITH CHECK (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "org can delete job_instruction_parts" ON public.job_instruction_parts FOR DELETE TO authenticated USING (public.users_share_org(auth.uid(), user_id));
CREATE INDEX idx_job_instruction_parts_instruction ON public.job_instruction_parts(instruction_id);
