-- Create bank_transactions table to track all money movements
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'sale_profit')),
  description TEXT,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bank transactions"
  ON public.bank_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank transactions"
  ON public.bank_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank transactions"
  ON public.bank_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank transactions"
  ON public.bank_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_bank_transactions_user_id ON public.bank_transactions(user_id);
CREATE INDEX idx_bank_transactions_created_at ON public.bank_transactions(created_at DESC);