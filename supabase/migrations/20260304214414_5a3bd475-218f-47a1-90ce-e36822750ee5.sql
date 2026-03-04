CREATE TABLE public.part_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  notes text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(part_id, inventory_item_id)
);

ALTER TABLE public.part_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own part inventory items" ON public.part_inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own part inventory items" ON public.part_inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own part inventory items" ON public.part_inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own part inventory items" ON public.part_inventory_items FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org part inventory items" ON public.part_inventory_items FOR SELECT USING (users_share_org(auth.uid(), user_id));