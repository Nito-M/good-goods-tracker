CREATE POLICY "Users can update own asset images"
  ON public.asset_images FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());