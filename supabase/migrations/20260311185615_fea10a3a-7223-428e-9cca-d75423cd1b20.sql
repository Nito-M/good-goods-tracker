
CREATE TABLE public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  is_done BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own todos" ON public.todos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own todos" ON public.todos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos" ON public.todos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own todos" ON public.todos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org todos" ON public.todos FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
