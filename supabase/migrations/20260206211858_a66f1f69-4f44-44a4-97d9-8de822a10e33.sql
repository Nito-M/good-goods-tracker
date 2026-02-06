-- Add request_number column to requests table
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS request_number text;

-- Create function to generate request number
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
    WHERE user_id = NEW.user_id;
    
    NEW.request_number := 'REQ-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating request numbers
DROP TRIGGER IF EXISTS generate_request_number_trigger ON public.requests;
CREATE TRIGGER generate_request_number_trigger
BEFORE INSERT ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.generate_request_number();

-- Backfill existing requests with numbers
WITH numbered_requests AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.requests
  WHERE request_number IS NULL
)
UPDATE public.requests r
SET request_number = 'REQ-' || LPAD(nr.rn::TEXT, 4, '0')
FROM numbered_requests nr
WHERE r.id = nr.id;

-- Add request_id column to purchase_orders for linking
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL;