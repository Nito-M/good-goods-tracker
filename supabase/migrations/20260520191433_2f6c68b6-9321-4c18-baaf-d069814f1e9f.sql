CREATE TABLE public.sale_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_adjustments_sale_id ON public.sale_adjustments(sale_id);

ALTER TABLE public.sale_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sale adjustments in their org"
ON public.sale_adjustments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_adjustments.sale_id
      AND (s.user_id = auth.uid() OR public.users_share_org(auth.uid(), s.user_id))
  )
);

CREATE POLICY "Users can insert sale adjustments in their org"
ON public.sale_adjustments FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_adjustments.sale_id
      AND (s.user_id = auth.uid() OR public.users_share_org(auth.uid(), s.user_id))
  )
);

CREATE POLICY "Users can update sale adjustments in their org"
ON public.sale_adjustments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_adjustments.sale_id
      AND (s.user_id = auth.uid() OR public.users_share_org(auth.uid(), s.user_id))
  )
);

CREATE POLICY "Users can delete sale adjustments in their org"
ON public.sale_adjustments FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_adjustments.sale_id
      AND (s.user_id = auth.uid() OR public.users_share_org(auth.uid(), s.user_id))
  )
);

CREATE TRIGGER update_sale_adjustments_updated_at
BEFORE UPDATE ON public.sale_adjustments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();