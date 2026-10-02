
-- customer_contacts
CREATE TABLE public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_contacts_customer ON public.customer_contacts(customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_contacts TO authenticated;
GRANT ALL ON public.customer_contacts TO service_role;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view customer contacts" ON public.customer_contacts FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members insert customer contacts" ON public.customer_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members update customer contacts" ON public.customer_contacts FOR UPDATE TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members delete customer contacts" ON public.customer_contacts FOR DELETE TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE TRIGGER trg_customer_contacts_updated BEFORE UPDATE ON public.customer_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- customer_links
CREATE TABLE public.customer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_links_customer ON public.customer_links(customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_links TO authenticated;
GRANT ALL ON public.customer_links TO service_role;
ALTER TABLE public.customer_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view customer links" ON public.customer_links FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members insert customer links" ON public.customer_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members update customer links" ON public.customer_links FOR UPDATE TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members delete customer links" ON public.customer_links FOR DELETE TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE TRIGGER trg_customer_links_updated BEFORE UPDATE ON public.customer_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- customer_notes
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_notes_customer ON public.customer_notes(customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view customer notes" ON public.customer_notes FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members insert customer notes" ON public.customer_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members update customer notes" ON public.customer_notes FOR UPDATE TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members delete customer notes" ON public.customer_notes FOR DELETE TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE TRIGGER trg_customer_notes_updated BEFORE UPDATE ON public.customer_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
