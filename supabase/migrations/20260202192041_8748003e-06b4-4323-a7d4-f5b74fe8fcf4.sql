-- Create function to generate sequential invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  -- Get the next number for this user
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ '^INV-[0-9]+$' 
      THEN CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.sales
  WHERE user_id = NEW.user_id;
  
  -- Only set if invoice_number is null or empty
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-generate invoice numbers
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();