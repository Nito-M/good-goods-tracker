
CREATE TABLE public.part_manufacturing_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  machine TEXT NOT NULL DEFAULT 'Other',
  operation_type TEXT NOT NULL DEFAULT 'Custom',
  length TEXT,
  angle TEXT,
  hole_diameter TEXT,
  quantity INTEGER,
  position_offset TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.part_manufacturing_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own manufacturing steps" ON public.part_manufacturing_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own manufacturing steps" ON public.part_manufacturing_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own manufacturing steps" ON public.part_manufacturing_steps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own manufacturing steps" ON public.part_manufacturing_steps FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org manufacturing steps" ON public.part_manufacturing_steps FOR SELECT USING (users_share_org(auth.uid(), user_id));
