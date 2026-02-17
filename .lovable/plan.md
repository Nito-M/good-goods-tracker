

## Sales Order Detail Page with "Convert to Job" Feature

### What You'll Get
- Clickable quote numbers on the Sales Orders table that navigate to a dedicated detail page
- A full Sales Order detail page showing all quote info (customer, items, totals, notes)
- A "Create Job from Sales Order" button that creates a new Job pre-filled with the quote's customer info and line items, then navigates to the Jobs page

### Changes

**`src/pages/SalesOrders.tsx`**
- Make the Quote Number cell a clickable link (`<Link to={/sales-orders/${quote.id}}>`) styled as a text link

**New file: `src/pages/SalesOrderDetail.tsx`**
- Full page showing the accepted quote details:
  - Header with back arrow to `/sales-orders` and the quote number as title
  - Customer info card (name, phone, email, address from vendor)
  - Items table listing all quote items (name, SKU, qty, unit price, total)
  - Totals section (subtotal, discount, tax, total)
  - Notes section if present
- "Create Job" button in the header that:
  - Calls `createJob()` with the quote's customer name/email/phone as customer details, and the quote number as the job title
  - Adds all quote line items as job items via `addItem()` from `useJobItems`
  - Navigates to the new job's page on success

**`src/App.tsx`**
- Add route `/sales-orders/:id` pointing to the new `SalesOrderDetail` component

**`src/hooks/usePagePermissions.ts`**
- Add `/sales-orders/:id` to the `sales-orders` route list so permissions carry over

