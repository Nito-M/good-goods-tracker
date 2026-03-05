
-- Trip plans table
CREATE TABLE public.trip_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  color TEXT NOT NULL DEFAULT 'bg-teal-500',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trip plan locations (ordered stops)
CREATE TABLE public.trip_plan_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_plan_id UUID NOT NULL REFERENCES public.trip_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trip plan linked POs
CREATE TABLE public.trip_plan_pos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_plan_id UUID NOT NULL REFERENCES public.trip_plans(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_plan_id, purchase_order_id)
);

-- RLS for trip_plans
ALTER TABLE public.trip_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trip plans" ON public.trip_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trip plans" ON public.trip_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trip plans" ON public.trip_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trip plans" ON public.trip_plans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org trip plans" ON public.trip_plans FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- RLS for trip_plan_locations
ALTER TABLE public.trip_plan_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage trip plan locations via trip plan" ON public.trip_plan_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.trip_plans WHERE trip_plans.id = trip_plan_locations.trip_plan_id AND trip_plans.user_id = auth.uid())
);

-- RLS for trip_plan_pos
ALTER TABLE public.trip_plan_pos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage trip plan POs via trip plan" ON public.trip_plan_pos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.trip_plans WHERE trip_plans.id = trip_plan_pos.trip_plan_id AND trip_plans.user_id = auth.uid())
);
