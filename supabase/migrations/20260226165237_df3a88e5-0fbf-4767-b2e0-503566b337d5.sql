
-- Add subcategory column to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN subcategory text DEFAULT NULL;

-- Create subcategories table
CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subcategories" ON public.subcategories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subcategories" ON public.subcategories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subcategories" ON public.subcategories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subcategories" ON public.subcategories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org subcategories" ON public.subcategories FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
