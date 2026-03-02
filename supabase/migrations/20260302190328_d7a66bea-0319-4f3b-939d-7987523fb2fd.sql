
CREATE TABLE public.request_sub_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vendor_name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  link text,
  notes text,
  is_selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.request_sub_items ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "Users can view their own request sub items"
  ON public.request_sub_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own request sub items"
  ON public.request_sub_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own request sub items"
  ON public.request_sub_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own request sub items"
  ON public.request_sub_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Org members can view
CREATE POLICY "Org members can view org request sub items"
  ON public.request_sub_items FOR SELECT TO authenticated
  USING (users_share_org(auth.uid(), user_id));

-- Org members can update (admins)
CREATE POLICY "Org admins can update org request sub items"
  ON public.request_sub_items FOR UPDATE TO authenticated
  USING (users_share_org(auth.uid(), user_id));
