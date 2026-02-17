
-- Create companies table
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  business_number text,
  logo_url text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own companies" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own companies" ON public.companies FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org companies" ON public.companies FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- Updated_at trigger
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add company_id to sales, purchase_orders, quotes
ALTER TABLE public.sales ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.purchase_orders ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.quotes ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Migrate existing profile business info into companies table
INSERT INTO public.companies (user_id, name, address, phone, email, business_number, logo_url, is_default)
SELECT
  user_id,
  business_name,
  business_address,
  business_phone,
  business_email,
  business_number,
  logo_url,
  true
FROM public.profiles
WHERE business_name IS NOT NULL AND TRIM(business_name) != '';
