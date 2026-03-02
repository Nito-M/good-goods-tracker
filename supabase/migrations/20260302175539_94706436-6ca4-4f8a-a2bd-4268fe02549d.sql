CREATE OR REPLACE FUNCTION public.generate_request_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
  org_user_ids uuid[];
BEGIN
  IF NEW.request_number IS NULL OR TRIM(NEW.request_number) = '' THEN
    -- Get all user_ids in the same organization as the inserting user
    SELECT ARRAY_AGG(om2.user_id)
    INTO org_user_ids
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = NEW.user_id;

    -- Fallback: if user is not in any org, just use their own user_id
    IF org_user_ids IS NULL THEN
      org_user_ids := ARRAY[NEW.user_id];
    END IF;

    SELECT COALESCE(MAX(
      CASE 
        WHEN request_number ~ '^REQ-[0-9]+$' 
        THEN CAST(SUBSTRING(request_number FROM 5) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM public.requests
    WHERE user_id = ANY(org_user_ids);
    
    NEW.request_number := 'REQ-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$function$;