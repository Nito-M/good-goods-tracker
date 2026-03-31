
-- Table for cards within each instruction
CREATE TABLE public.instruction_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id UUID NOT NULL REFERENCES public.how_to_instructions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  link TEXT DEFAULT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for files (images/PDFs) attached to cards
CREATE TABLE public.instruction_card_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.instruction_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instruction_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruction_card_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for instruction_cards
CREATE POLICY "Users can view own instruction cards" ON public.instruction_cards FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own instruction cards" ON public.instruction_cards FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own instruction cards" ON public.instruction_cards FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own instruction cards" ON public.instruction_cards FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS policies for instruction_card_files
CREATE POLICY "Users can view own card files" ON public.instruction_card_files FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own card files" ON public.instruction_card_files FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own card files" ON public.instruction_card_files FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_instruction_cards_updated_at BEFORE UPDATE ON public.instruction_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
