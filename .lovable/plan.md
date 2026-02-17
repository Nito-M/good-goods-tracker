

## Add "Sales Orders" Sub-Page Under Sales

### Overview
Create a new page that shows only **accepted quotes** from the existing quotes data, displayed in a clean table with the requested columns. It will appear as a sidebar sub-item under "Sales" alongside "Quotes".

### What You'll See
- A new "Sales Orders" link in the sidebar under the Sales section
- A page with a searchable table showing accepted quotes with columns:
  - Quote Number
  - Customer Name (from the linked vendor/customer)
  - Phone (from the vendor's contact phone)
  - Email (from the vendor's contact email)
  - Total Amount
  - Date Accepted (the quote's `updated_at` timestamp when status changed to "accepted")
  - Status (the quote status badge)

"Salesperson" is skipped for now as requested.

---

### Technical Details

**New file: `src/pages/SalesOrders.tsx`**
- Create a page component that uses the existing `useQuotes` hook
- Filter quotes to only those with `status === 'accepted'`
- Join vendor data (already fetched by `useQuotes` as `vendorName`) for customer name, and use `useVendors` for phone/email lookup
- Include a search bar to filter by quote number or customer name
- Display results in a `Table` component matching the existing UI patterns

**Modified: `src/components/AppSidebar.tsx`**
- Add "Sales Orders" as a second sub-item under the Sales collapsible section, alongside "Quotes"

**Modified: `src/hooks/usePagePermissions.ts`**
- Add `'sales-orders': ['/sales-orders']` to the `PAGE_KEY_TO_ROUTES` map
- Add `'sales-orders'` to the `orderedKeys` list

**Modified: `src/App.tsx`**
- Import the new `SalesOrders` component
- Add a new route `/sales-orders` wrapped in `ProtectedRoute` and `AppLayout`

### No Database Changes Required
This page reads from the existing `quotes` and `vendors` tables -- no new tables or migrations needed.
