-- Update the generate_invoice_number function to use custom prefix from profile
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
  user_prefix TEXT;
BEGIN
  -- Only set if invoice_number is null, empty string, or whitespace only
  IF NEW.invoice_number IS NULL OR TRIM(NEW.invoice_number) = '' THEN
    -- Get the custom prefix from user's profile (default to 'INV' if not set)
    SELECT COALESCE(invoice_prefix, 'INV') INTO user_prefix
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- If no profile found, use default 'INV'
    IF user_prefix IS NULL THEN
      user_prefix := 'INV';
    END IF;
    
    -- Get the next number for this user (looking for any pattern ending with numbers)
    SELECT COALESCE(MAX(
      CASE 
        WHEN invoice_number ~ ('^' || user_prefix || '-[0-9]+$')
        THEN CAST(SUBSTRING(invoice_number FROM LENGTH(user_prefix) + 2) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM public.sales
    WHERE user_id = NEW.user_id;
    
    NEW.invoice_number := user_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$function$;