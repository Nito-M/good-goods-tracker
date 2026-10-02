-- Fix 1: Restrict warehouses RLS policies to authenticated role only
DROP POLICY IF EXISTS "Org members can view org warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Users can delete their own warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Users can update their own warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Users can view their own warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Users can insert their own warehouses" ON public.warehouses;

CREATE POLICY "Org members can view org warehouses" ON public.warehouses
FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can view their own warehouses" ON public.warehouses
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warehouses" ON public.warehouses
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouses" ON public.warehouses
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouses" ON public.warehouses
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix 2: Add display_name validation to handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name_input text;
BEGIN
  display_name_input := NEW.raw_user_meta_data->>'display_name';
  
  -- Validate and truncate length
  IF display_name_input IS NOT NULL THEN
    display_name_input := SUBSTRING(display_name_input, 1, 100);
  END IF;
  
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, display_name_input);
  RETURN NEW;
END;
$$;

-- Fix 3: Create signup_requests_log table for rate limiting
CREATE TABLE IF NOT EXISTS public.signup_requests_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.signup_requests_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_signup_requests_ip_time ON public.signup_requests_log(ip_address, created_at);