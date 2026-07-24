Give customers the same rich detail view that vendors have: a dedicated Customer Detail page with Contacts, Links, Files & PDFs, multi-Notes, and a grouped history of sales/quotes — matching the vendor screenshot.

## What to build

1. **New `CustomerDetail` page** at `/customers/:id`
   - Header with color swatch, name, Edit / Delete buttons (Edit opens existing customer dialog logic, or a new `/customers/:id/edit` page)
   - Contact Information card (email, phone, address, link)
   - Summary card (Sales count, Total Invoiced, Quotes count, Total Quoted, color)
   - Contacts, Links, Files & PDFs, Notes sections
   - Sales history grouped by Year → Month (collapsible), like vendor POs
   - Recent Quotes list

2. **New DB tables** (mirroring vendor equivalents), each with GRANTs + RLS scoped via `users_share_org`:
   - `customer_contacts` (name, role, email, phone, notes)
   - `customer_links` (label, url)
   - `customer_notes` (content, timestamps)
   - `customer_files` already exists — reuse

3. **New hooks**: `useCustomerContacts`, `useCustomerLinks`, `useCustomerNotes`

4. **New components** (parallel to vendor versions):
   - `CustomerContactsManager`
   - `CustomerLinksSection`
   - `CustomerNotesList`

5. **Wire-up**
   - Add route in `src/App.tsx`
   - In `Settings.tsx` customers list, make each customer row clickable → navigate to `/customers/:id` (keep existing edit dialog available from the detail page action)

## Technical notes

- Sales/quotes history pulls from existing `useSales` / `useQuotes` filtered by `customerId`.
- RLS pattern: `GRANT SELECT/INSERT/UPDATE/DELETE ... TO authenticated`, `GRANT ALL ... TO service_role`, policies via `users_share_org(auth.uid(), user_id)` — identical to `vendor_notes`/`vendor_links`.
- No changes to vendor code; components are duplicated (not generified) to avoid regressions.
