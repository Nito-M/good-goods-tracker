
-- Create tag_categories table
CREATE TABLE public.tag_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tag_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tag categories" ON public.tag_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org tag categories" ON public.tag_categories FOR SELECT USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own tag categories" ON public.tag_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tag categories" ON public.tag_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tag categories" ON public.tag_categories FOR DELETE USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tag_category_id UUID NOT NULL REFERENCES public.tag_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org tags" ON public.tags FOR SELECT USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Create item_tags junction table
CREATE TABLE public.item_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, tag_id)
);

ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own item tags" ON public.item_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org item tags" ON public.item_tags FOR SELECT USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own item tags" ON public.item_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own item tags" ON public.item_tags FOR DELETE USING (auth.uid() = user_id);
