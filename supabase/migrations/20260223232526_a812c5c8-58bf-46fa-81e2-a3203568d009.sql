-- Batch 2: inventory_items, item_images, item_location_quantities, item_tags, item_vendor_prices

-- inventory_items
DROP POLICY IF EXISTS "Org admins can update org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Org members can view org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory_items;
CREATE POLICY "Org admins can update org inventory" ON public.inventory_items FOR UPDATE TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members can view org inventory" ON public.inventory_items FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own inventory" ON public.inventory_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own inventory" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own inventory" ON public.inventory_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own inventory" ON public.inventory_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- item_images
DROP POLICY IF EXISTS "Org members can view org item images" ON public.item_images;
DROP POLICY IF EXISTS "Users can delete their own item images" ON public.item_images;
DROP POLICY IF EXISTS "Users can insert their own item images" ON public.item_images;
DROP POLICY IF EXISTS "Users can update their own item images" ON public.item_images;
DROP POLICY IF EXISTS "Users can view their own item images" ON public.item_images;
CREATE POLICY "Org members can view org item images" ON public.item_images FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own item images" ON public.item_images FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own item images" ON public.item_images FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own item images" ON public.item_images FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own item images" ON public.item_images FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- item_location_quantities
DROP POLICY IF EXISTS "Org members can view org item location quantities" ON public.item_location_quantities;
DROP POLICY IF EXISTS "Users can delete their own item location quantities" ON public.item_location_quantities;
DROP POLICY IF EXISTS "Users can insert their own item location quantities" ON public.item_location_quantities;
DROP POLICY IF EXISTS "Users can update their own item location quantities" ON public.item_location_quantities;
DROP POLICY IF EXISTS "Users can view their own item location quantities" ON public.item_location_quantities;
CREATE POLICY "Org members can view org item location quantities" ON public.item_location_quantities FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own item location quantities" ON public.item_location_quantities FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own item location quantities" ON public.item_location_quantities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own item location quantities" ON public.item_location_quantities FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own item location quantities" ON public.item_location_quantities FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- item_tags
DROP POLICY IF EXISTS "Org members can view org item tags" ON public.item_tags;
DROP POLICY IF EXISTS "Users can delete their own item tags" ON public.item_tags;
DROP POLICY IF EXISTS "Users can insert their own item tags" ON public.item_tags;
DROP POLICY IF EXISTS "Users can view their own item tags" ON public.item_tags;
CREATE POLICY "Org members can view org item tags" ON public.item_tags FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own item tags" ON public.item_tags FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own item tags" ON public.item_tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own item tags" ON public.item_tags FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- item_vendor_prices
DROP POLICY IF EXISTS "Org members can view org item vendor prices" ON public.item_vendor_prices;
DROP POLICY IF EXISTS "Users can delete their own item vendor prices" ON public.item_vendor_prices;
DROP POLICY IF EXISTS "Users can insert their own item vendor prices" ON public.item_vendor_prices;
DROP POLICY IF EXISTS "Users can update their own item vendor prices" ON public.item_vendor_prices;
DROP POLICY IF EXISTS "Users can view their own item vendor prices" ON public.item_vendor_prices;
CREATE POLICY "Org members can view org item vendor prices" ON public.item_vendor_prices FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own item vendor prices" ON public.item_vendor_prices FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own item vendor prices" ON public.item_vendor_prices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own item vendor prices" ON public.item_vendor_prices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own item vendor prices" ON public.item_vendor_prices FOR SELECT TO authenticated USING (auth.uid() = user_id);