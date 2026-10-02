
-- Customer contacts
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  job_position TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_contacts TO authenticated;
GRANT ALL ON public.customer_contacts TO service_role;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own or shared org customer contacts" ON public.customer_contacts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert own customer contacts" ON public.customer_contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own or shared org customer contacts" ON public.customer_contacts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete own or shared org customer contacts" ON public.customer_contacts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE TRIGGER update_customer_contacts_updated_at BEFORE UPDATE ON public.customer_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customer links
CREATE TABLE IF NOT EXISTS public.customer_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_links TO authenticated;
GRANT ALL ON public.customer_links TO service_role;
ALTER TABLE public.customer_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own or shared org customer links" ON public.customer_links
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert own customer links" ON public.customer_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own or shared org customer links" ON public.customer_links
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete own or shared org customer links" ON public.customer_links
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE TRIGGER update_customer_links_updated_at BEFORE UPDATE ON public.customer_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customer notes
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own or shared org customer notes" ON public.customer_notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can insert own customer notes" ON public.customer_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own or shared org customer notes" ON public.customer_notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete own or shared org customer notes" ON public.customer_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON public.customer_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
