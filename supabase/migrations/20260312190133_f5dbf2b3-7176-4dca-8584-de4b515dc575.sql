CREATE TABLE public.request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.request_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own request images"
  ON public.request_images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own request images"
  ON public.request_images FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org request images"
  ON public.request_images FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = request_images.request_id
    AND users_share_org(auth.uid(), r.user_id)
  ));

CREATE POLICY "Users can delete their own request images"
  ON public.request_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Org admins can delete org request images"
  ON public.request_images FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = request_images.request_id
    AND users_share_org(auth.uid(), r.user_id)
  ));