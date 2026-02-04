-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_rate NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  payment_terms TEXT DEFAULT 'Due on receipt',
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_items table
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes" 
ON public.quotes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes" 
ON public.quotes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" 
ON public.quotes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" 
ON public.quotes FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on quote_items
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quote items" 
ON public.quote_items FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own quote items" 
ON public.quote_items FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can update their own quote items" 
ON public.quote_items FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own quote items" 
ON public.quote_items FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
));

-- Create trigger for auto-generating quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.quote_number IS NULL OR TRIM(NEW.quote_number) = '' THEN
    SELECT COALESCE(MAX(
      CASE 
        WHEN quote_number ~ '^QUO-[0-9]+$' 
        THEN CAST(SUBSTRING(quote_number FROM 5) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM public.quotes
    WHERE user_id = NEW.user_id;
    
    NEW.quote_number := 'QUO-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_quote_number_trigger
BEFORE INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.generate_quote_number();

-- Create trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add quote settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS quote_thank_you_note TEXT DEFAULT 'Thank you for considering our services!',
ADD COLUMN IF NOT EXISTS quote_validity_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS quote_layout JSONB DEFAULT '{"logo": {"x": 20, "y": 20, "visible": true}, "notes": {"x": 20, "y": -1, "visible": true}, "billTo": {"x": 20, "y": 100, "visible": true}, "footer": {"x": 105, "y": -1, "align": "center", "visible": true}, "totals": {"x": 140, "y": -1, "align": "right", "visible": true}, "itemsTable": {"x": 20, "y": 130, "visible": true}, "businessInfo": {"x": 140, "y": 20, "align": "right", "visible": true}, "quoteTitle": {"x": 105, "y": 60, "align": "center", "visible": true}, "quoteDetails": {"x": 20, "y": 75, "visible": true}}'::jsonb;