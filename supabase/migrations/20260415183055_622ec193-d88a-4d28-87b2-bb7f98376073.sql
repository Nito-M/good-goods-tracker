
CREATE TABLE public.trailer_lengths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  label TEXT NOT NULL,
  compatible_trailer_type_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trailer_lengths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trailer lengths in their org"
  ON public.trailer_lengths FOR SELECT TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert their own trailer lengths"
  ON public.trailer_lengths FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trailer lengths"
  ON public.trailer_lengths FOR UPDATE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can delete their own trailer lengths"
  ON public.trailer_lengths FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

-- Add trailer_length_id to prebuilt_assemblies for matching
ALTER TABLE public.prebuilt_assemblies ADD COLUMN trailer_length_id UUID REFERENCES public.trailer_lengths(id) ON DELETE SET NULL;
