
-- Create part_folders table for nested folder structure
CREATE TABLE public.part_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.part_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to parts table
ALTER TABLE public.parts ADD COLUMN folder_id UUID REFERENCES public.part_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.part_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for part_folders
CREATE POLICY "Users can view their own folders" ON public.part_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own folders" ON public.part_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.part_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.part_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org folders" ON public.part_folders FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));

-- Updated_at trigger
CREATE TRIGGER update_part_folders_updated_at BEFORE UPDATE ON public.part_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
