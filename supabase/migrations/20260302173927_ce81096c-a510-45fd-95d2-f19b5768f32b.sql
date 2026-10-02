CREATE OR REPLACE FUNCTION public.generate_request_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.request_number IS NULL OR TRIM(NEW.request_number) = '' THEN
    SELECT COALESCE(MAX(
      CASE 
        WHEN request_number ~ '^REQ-[0-9]+$' 
        THEN CAST(SUBSTRING(request_number FROM 5) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM public.requests
    WHERE user_id = NEW.user_id
    FOR UPDATE;
    
    NEW.request_number := 'REQ-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$function$;