-- Add po_number column to purchase_orders
ALTER TABLE public.purchase_orders
ADD COLUMN po_number TEXT;

-- Create a function to generate PO numbers
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Get the next number for this user
  SELECT COALESCE(MAX(
    CASE 
      WHEN po_number ~ '^PO-[0-9]+$' 
      THEN CAST(SUBSTRING(po_number FROM 4) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.purchase_orders
  WHERE user_id = NEW.user_id;
  
  -- Only set if po_number is null or empty
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate PO number on insert
CREATE TRIGGER generate_po_number_trigger
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_po_number();