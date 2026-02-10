
-- Remove super admin SELECT access from operational data tables
DROP POLICY IF EXISTS "Admins can view all bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Admins can view all calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Admins can view all item images" ON public.item_images;
DROP POLICY IF EXISTS "Admins can view all item vendor prices" ON public.item_vendor_prices;
DROP POLICY IF EXISTS "Admins can view all notes" ON public.notes;
DROP POLICY IF EXISTS "Admins can view all po item allocations" ON public.po_item_allocations;
DROP POLICY IF EXISTS "Admins can view all purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Admins can view all quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can view all sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can view all vendors" ON public.vendors;
