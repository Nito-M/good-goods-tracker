-- Create table for item-vendor pricing relationships
CREATE TABLE public.item_vendor_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  UNIQUE(item_id, vendor_id)
);

-- Enable RLS
ALTER TABLE public.item_vendor_prices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own item vendor prices" 
ON public.item_vendor_prices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own item vendor prices" 
ON public.item_vendor_prices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item vendor prices" 
ON public.item_vendor_prices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item vendor prices" 
ON public.item_vendor_prices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_item_vendor_prices_updated_at
BEFORE UPDATE ON public.item_vendor_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();