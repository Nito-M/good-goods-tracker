
-- Create how-to instructions table
CREATE TABLE public.how_to_instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'General',
  link TEXT,
  author_name TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.how_to_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own instructions" ON public.how_to_instructions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org instructions" ON public.how_to_instructions FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own instructions" ON public.how_to_instructions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own instructions" ON public.how_to_instructions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own instructions" ON public.how_to_instructions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create instruction files table
CREATE TABLE public.instruction_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id UUID NOT NULL REFERENCES public.how_to_instructions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instruction_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own instruction files" ON public.instruction_files FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org instruction files" ON public.instruction_files FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert their own instruction files" ON public.instruction_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own instruction files" ON public.instruction_files FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket for instruction files
INSERT INTO storage.buckets (id, name, public) VALUES ('instruction-files', 'instruction-files', false);

CREATE POLICY "Users can upload instruction files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'instruction-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view instruction files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'instruction-files');
CREATE POLICY "Users can delete instruction files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'instruction-files' AND (storage.foldername(name))[1] = auth.uid()::text);
