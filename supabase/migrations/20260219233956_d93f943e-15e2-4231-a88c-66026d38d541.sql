
CREATE TABLE public.po_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image', -- 'image' or 'pdf'
  file_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.po_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own po attachments"
  ON public.po_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org po attachments"
  ON public.po_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE purchase_orders.id = po_attachments.purchase_order_id
      AND users_share_org(auth.uid(), purchase_orders.user_id)
  ));

CREATE POLICY "Users can insert their own po attachments"
  ON public.po_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own po attachments"
  ON public.po_attachments FOR DELETE
  USING (auth.uid() = user_id);
