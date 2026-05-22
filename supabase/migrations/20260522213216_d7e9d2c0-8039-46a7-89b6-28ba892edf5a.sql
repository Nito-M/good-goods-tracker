CREATE TABLE IF NOT EXISTS public.so_item_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  child_quote_item_id uuid NOT NULL REFERENCES public.quote_items(id) ON DELETE CASCADE,
  child_unit_index integer NOT NULL DEFAULT 0,
  parent_quote_item_id uuid NOT NULL REFERENCES public.quote_items(id) ON DELETE CASCADE,
  parent_unit_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_quote_item_id, child_unit_index)
);

ALTER TABLE public.so_item_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own so_item_attachments"
ON public.so_item_attachments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_attachments.quote_id AND q.user_id = auth.uid()));

CREATE POLICY "Users can insert their own so_item_attachments"
ON public.so_item_attachments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_attachments.quote_id AND q.user_id = auth.uid()));

CREATE POLICY "Users can update their own so_item_attachments"
ON public.so_item_attachments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_attachments.quote_id AND q.user_id = auth.uid()));

CREATE POLICY "Users can delete their own so_item_attachments"
ON public.so_item_attachments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = so_item_attachments.quote_id AND q.user_id = auth.uid()));

CREATE TRIGGER update_so_item_attachments_updated_at
BEFORE UPDATE ON public.so_item_attachments
FOR EACH ROW EXECUTE FUNCTION public.update_so_item_job_links_updated_at();