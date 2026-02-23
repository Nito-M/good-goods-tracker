
-- Create junction table for item location quantities
CREATE TABLE public.item_location_quantities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, warehouse_id)
);

-- RLS
ALTER TABLE public.item_location_quantities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own item location quantities"
  ON public.item_location_quantities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org item location quantities"
  ON public.item_location_quantities FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert their own item location quantities"
  ON public.item_location_quantities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item location quantities"
  ON public.item_location_quantities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item location quantities"
  ON public.item_location_quantities FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_item_location_quantities_updated_at
  BEFORE UPDATE ON public.item_location_quantities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
