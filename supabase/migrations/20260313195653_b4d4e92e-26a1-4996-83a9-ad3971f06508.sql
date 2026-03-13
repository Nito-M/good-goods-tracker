
CREATE TABLE public.asset_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own asset notes" ON public.asset_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org asset notes" ON public.asset_notes FOR SELECT USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own asset notes" ON public.asset_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own asset notes" ON public.asset_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own asset notes" ON public.asset_notes FOR DELETE USING (auth.uid() = user_id);
