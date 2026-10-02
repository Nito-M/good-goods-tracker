
-- parts_2: add org SELECT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can view own parts_2" ON public.parts_2;
CREATE POLICY "Users can view own or org parts_2" ON public.parts_2
  FOR SELECT USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can update own parts_2" ON public.parts_2;
CREATE POLICY "Users can update own or org parts_2" ON public.parts_2
  FOR UPDATE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can delete own parts_2" ON public.parts_2;
CREATE POLICY "Users can delete own or org parts_2" ON public.parts_2
  FOR DELETE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

-- part_folders_2: add org SELECT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can view own part_folders_2" ON public.part_folders_2;
CREATE POLICY "Users can view own or org part_folders_2" ON public.part_folders_2
  FOR SELECT USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can update own part_folders_2" ON public.part_folders_2;
CREATE POLICY "Users can update own or org part_folders_2" ON public.part_folders_2
  FOR UPDATE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can delete own part_folders_2" ON public.part_folders_2;
CREATE POLICY "Users can delete own or org part_folders_2" ON public.part_folders_2
  FOR DELETE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

-- part_inventory_items_2: add org SELECT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can view own part_inventory_items_2" ON public.part_inventory_items_2;
CREATE POLICY "Users can view own or org part_inventory_items_2" ON public.part_inventory_items_2
  FOR SELECT USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can update own part_inventory_items_2" ON public.part_inventory_items_2;
CREATE POLICY "Users can update own or org part_inventory_items_2" ON public.part_inventory_items_2
  FOR UPDATE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can delete own part_inventory_items_2" ON public.part_inventory_items_2;
CREATE POLICY "Users can delete own or org part_inventory_items_2" ON public.part_inventory_items_2
  FOR DELETE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

-- part_manufacturing_steps_2: add org SELECT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can view own part_manufacturing_steps_2" ON public.part_manufacturing_steps_2;
CREATE POLICY "Users can view own or org part_manufacturing_steps_2" ON public.part_manufacturing_steps_2
  FOR SELECT USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can update own part_manufacturing_steps_2" ON public.part_manufacturing_steps_2;
CREATE POLICY "Users can update own or org part_manufacturing_steps_2" ON public.part_manufacturing_steps_2
  FOR UPDATE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can delete own part_manufacturing_steps_2" ON public.part_manufacturing_steps_2;
CREATE POLICY "Users can delete own or org part_manufacturing_steps_2" ON public.part_manufacturing_steps_2
  FOR DELETE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

-- part_step_images_2: add org SELECT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can view own part_step_images_2" ON public.part_step_images_2;
CREATE POLICY "Users can view own or org part_step_images_2" ON public.part_step_images_2
  FOR SELECT USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can update own part_step_images_2" ON public.part_step_images_2;
CREATE POLICY "Users can update own or org part_step_images_2" ON public.part_step_images_2
  FOR UPDATE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can delete own part_step_images_2" ON public.part_step_images_2;
CREATE POLICY "Users can delete own or org part_step_images_2" ON public.part_step_images_2
  FOR DELETE USING (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));
