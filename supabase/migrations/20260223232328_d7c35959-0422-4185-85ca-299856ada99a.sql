-- Batch 1: Fix anonymous access on assemblies, assembly_items, bank_cards, bank_transactions, calendar_events, categories, companies, customers

-- assemblies
DROP POLICY IF EXISTS "Org members can view org assemblies" ON public.assemblies;
DROP POLICY IF EXISTS "Users can delete their own assemblies" ON public.assemblies;
DROP POLICY IF EXISTS "Users can insert their own assemblies" ON public.assemblies;
DROP POLICY IF EXISTS "Users can update their own assemblies" ON public.assemblies;
DROP POLICY IF EXISTS "Users can view their own assemblies" ON public.assemblies;
CREATE POLICY "Org members can view org assemblies" ON public.assemblies FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own assemblies" ON public.assemblies FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assemblies" ON public.assemblies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assemblies" ON public.assemblies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own assemblies" ON public.assemblies FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- assembly_items
DROP POLICY IF EXISTS "Org members can view org assembly items" ON public.assembly_items;
DROP POLICY IF EXISTS "Users can delete their own assembly items" ON public.assembly_items;
DROP POLICY IF EXISTS "Users can insert their own assembly items" ON public.assembly_items;
DROP POLICY IF EXISTS "Users can update their own assembly items" ON public.assembly_items;
DROP POLICY IF EXISTS "Users can view their own assembly items" ON public.assembly_items;
CREATE POLICY "Org members can view org assembly items" ON public.assembly_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM assemblies WHERE assemblies.id = assembly_items.assembly_id AND users_share_org(auth.uid(), assemblies.user_id)));
CREATE POLICY "Users can delete their own assembly items" ON public.assembly_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM assemblies WHERE assemblies.id = assembly_items.assembly_id AND assemblies.user_id = auth.uid()));
CREATE POLICY "Users can insert their own assembly items" ON public.assembly_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM assemblies WHERE assemblies.id = assembly_items.assembly_id AND assemblies.user_id = auth.uid()));
CREATE POLICY "Users can update their own assembly items" ON public.assembly_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM assemblies WHERE assemblies.id = assembly_items.assembly_id AND assemblies.user_id = auth.uid()));
CREATE POLICY "Users can view their own assembly items" ON public.assembly_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM assemblies WHERE assemblies.id = assembly_items.assembly_id AND assemblies.user_id = auth.uid()));

-- bank_cards
DROP POLICY IF EXISTS "Users can delete their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can insert their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can update their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can view their own bank cards" ON public.bank_cards;
CREATE POLICY "Users can delete their own bank cards" ON public.bank_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bank cards" ON public.bank_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank cards" ON public.bank_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own bank cards" ON public.bank_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- bank_transactions
DROP POLICY IF EXISTS "Org members can view org bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can delete their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can insert their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can update their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can view their own bank transactions" ON public.bank_transactions;
CREATE POLICY "Org members can view org bank transactions" ON public.bank_transactions FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own bank transactions" ON public.bank_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bank transactions" ON public.bank_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank transactions" ON public.bank_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own bank transactions" ON public.bank_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- calendar_events
DROP POLICY IF EXISTS "Org members can view org calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.calendar_events;
CREATE POLICY "Org members can view org calendar events" ON public.calendar_events FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can create their own events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.calendar_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own events" ON public.calendar_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- categories
DROP POLICY IF EXISTS "Org members can view org categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
CREATE POLICY "Org members can view org categories" ON public.categories FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own categories" ON public.categories FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- companies
DROP POLICY IF EXISTS "Org members can view org companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
CREATE POLICY "Org members can view org companies" ON public.companies FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own companies" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own companies" ON public.companies FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- customers
DROP POLICY IF EXISTS "Org members can view org customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Org members can view org customers" ON public.customers FOR SELECT TO authenticated USING (users_share_org(auth.uid(), user_id));
CREATE POLICY "Users can delete their own customers" ON public.customers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own customers" ON public.customers FOR SELECT TO authenticated USING (auth.uid() = user_id);