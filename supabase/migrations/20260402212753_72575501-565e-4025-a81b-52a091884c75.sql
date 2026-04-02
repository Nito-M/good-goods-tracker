
-- Add invoiced_percentage to quotes
ALTER TABLE public.quotes ADD COLUMN invoiced_percentage NUMERIC NOT NULL DEFAULT 0;

-- Create quote_invoice_links table
CREATE TABLE public.quote_invoice_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  percentage NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_invoice_links ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can manage their own quote invoice links
CREATE POLICY "Users can view their own quote invoice links"
  ON public.quote_invoice_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own quote invoice links"
  ON public.quote_invoice_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own quote invoice links"
  ON public.quote_invoice_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid())
  );
