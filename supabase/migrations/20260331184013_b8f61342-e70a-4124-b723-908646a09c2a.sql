
CREATE TABLE public.instruction_card_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.instruction_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instruction_card_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own card notes"
  ON public.instruction_card_notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org members can view card notes"
  ON public.instruction_card_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.instruction_cards ic
      JOIN public.how_to_instructions hi ON hi.id = ic.instruction_id
      WHERE ic.id = instruction_card_notes.card_id
        AND public.users_share_org(auth.uid(), hi.user_id)
    )
  );
