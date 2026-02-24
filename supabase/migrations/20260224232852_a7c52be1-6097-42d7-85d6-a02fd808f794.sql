
-- Allow org admins to update org quotes
CREATE POLICY "Org admins can update org quotes"
ON public.quotes FOR UPDATE
USING (users_share_org(auth.uid(), user_id));

-- Allow org admins to update org quote items
CREATE POLICY "Org admins can update org quote items"
ON public.quote_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM quotes
  WHERE quotes.id = quote_items.quote_id
  AND users_share_org(auth.uid(), quotes.user_id)
));

-- Allow org admins to insert org quote items (for adding items to org quotes)
CREATE POLICY "Org admins can insert org quote items"
ON public.quote_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM quotes
  WHERE quotes.id = quote_items.quote_id
  AND users_share_org(auth.uid(), quotes.user_id)
));

-- Allow org admins to delete org quote items
CREATE POLICY "Org admins can delete org quote items"
ON public.quote_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM quotes
  WHERE quotes.id = quote_items.quote_id
  AND users_share_org(auth.uid(), quotes.user_id)
));
