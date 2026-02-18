
CREATE TABLE public.so_item_job_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  quote_item_id uuid NOT NULL REFERENCES public.quote_items(id) ON DELETE CASCADE,
  unit_index integer NOT NULL DEFAULT 0,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(quote_item_id, unit_index)
);

ALTER TABLE public.so_item_job_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own so_item_job_links"
  ON public.so_item_job_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes WHERE quotes.id = so_item_job_links.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own so_item_job_links"
  ON public.so_item_job_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes WHERE quotes.id = so_item_job_links.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own so_item_job_links"
  ON public.so_item_job_links FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.quotes WHERE quotes.id = so_item_job_links.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own so_item_job_links"
  ON public.so_item_job_links FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.quotes WHERE quotes.id = so_item_job_links.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.update_so_item_job_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_so_item_job_links_updated_at
  BEFORE UPDATE ON public.so_item_job_links
  FOR EACH ROW EXECUTE FUNCTION public.update_so_item_job_links_updated_at();
