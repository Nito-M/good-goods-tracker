
CREATE TABLE public.item_consumptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  description text,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.item_consumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consumptions" ON public.item_consumptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consumptions" ON public.item_consumptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own consumptions" ON public.item_consumptions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org consumptions" ON public.item_consumptions FOR SELECT USING (users_share_org(auth.uid(), user_id));
