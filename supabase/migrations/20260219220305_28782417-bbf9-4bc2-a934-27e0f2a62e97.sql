
CREATE TABLE public.bank_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT 'bg-primary',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bank cards"
  ON public.bank_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank cards"
  ON public.bank_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank cards"
  ON public.bank_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank cards"
  ON public.bank_cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_bank_cards_updated_at
  BEFORE UPDATE ON public.bank_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
