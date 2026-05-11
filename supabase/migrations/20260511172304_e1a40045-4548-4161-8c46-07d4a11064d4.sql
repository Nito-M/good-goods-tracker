-- Add sales_order_number column to quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sales_order_number TEXT;

-- Trigger to auto-generate SO number when status becomes 'sales_order'
CREATE OR REPLACE FUNCTION public.generate_sales_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.status = 'sales_order' AND (NEW.sales_order_number IS NULL OR TRIM(NEW.sales_order_number) = '') THEN
    SELECT COALESCE(MAX(
      CASE
        WHEN sales_order_number ~ '^SO-[0-9]+$'
        THEN CAST(SUBSTRING(sales_order_number FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM public.quotes
    WHERE user_id = NEW.user_id;

    NEW.sales_order_number := 'SO-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_sales_order_number ON public.quotes;
CREATE TRIGGER set_sales_order_number
BEFORE INSERT OR UPDATE OF status ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.generate_sales_order_number();

-- Backfill existing sales orders
DO $$
DECLARE
  r RECORD;
  next_num INTEGER;
BEGIN
  FOR r IN SELECT id, user_id FROM public.quotes WHERE status = 'sales_order' AND (sales_order_number IS NULL OR TRIM(sales_order_number) = '') ORDER BY user_id, created_at LOOP
    SELECT COALESCE(MAX(
      CASE WHEN sales_order_number ~ '^SO-[0-9]+$' THEN CAST(SUBSTRING(sales_order_number FROM 4) AS INTEGER) ELSE 0 END
    ), 0) + 1
    INTO next_num
    FROM public.quotes
    WHERE user_id = r.user_id;

    UPDATE public.quotes SET sales_order_number = 'SO-' || LPAD(next_num::TEXT, 4, '0') WHERE id = r.id;
  END LOOP;
END $$;