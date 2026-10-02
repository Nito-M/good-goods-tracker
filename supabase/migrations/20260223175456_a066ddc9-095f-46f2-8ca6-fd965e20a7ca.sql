
-- Create warehouses table
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own warehouses" ON public.warehouses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own warehouses" ON public.warehouses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own warehouses" ON public.warehouses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own warehouses" ON public.warehouses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org warehouses" ON public.warehouses FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- Add warehouse_id to inventory_items
ALTER TABLE public.inventory_items ADD COLUMN warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- Updated_at trigger
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
